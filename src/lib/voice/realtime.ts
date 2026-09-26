import type { WireMessage } from '@/lib/companion';

/**
 * Speech-to-speech Ember over WebRTC (OpenAI Realtime), with the client
 * secret minted by Zero so no key ever reaches the browser. Full duplex,
 * interruptible, and the flame animates to the actual audio.
 */

export type RealtimeEvent =
  | { type: 'connected' }
  | { type: 'user_speaking'; speaking: boolean }
  | { type: 'user_transcript'; text: string }
  | { type: 'assistant_delta'; text: string }
  | { type: 'assistant_done'; text: string }
  | { type: 'assistant_audio'; playing: boolean }
  | { type: 'error'; code: RealtimeErrorCode; message: string }
  | { type: 'closed' };

export type RealtimeErrorCode = 'session' | 'microphone' | 'connection' | 'model';

export type RealtimeSessionInfo = {
  client_secret: string;
  expires_at: number;
  model: string;
  voice: string;
};

export type RealtimeOptions = {
  /** Zero endpoint that mints client secrets. */
  sessionUrl: string;
  context: { localHour: number; memory: string | null };
  /** Earlier turns from this conversation, so voice picks up where text left off. */
  history: readonly WireMessage[];
  /** What Ember should say first (only when history is empty). */
  opening: string | null;
  onEvent: (event: RealtimeEvent) => void;
  onLevel: (level: number) => void;
  fetchImpl?: typeof fetch;
};

const CALLS_URL = 'https://api.openai.com/v1/realtime/calls';

export class RealtimeSession {
  private pc: RTCPeerConnection | null = null;
  private channel: RTCDataChannel | null = null;
  private mic: MediaStream | null = null;
  private audio: HTMLAudioElement | null = null;
  private analyser: { ctx: AudioContext; node: AnalyserNode; data: Uint8Array<ArrayBuffer>; frame: number } | null = null;
  private transcript = '';
  private closed = false;

  constructor(private readonly opts: RealtimeOptions) {}

  static supported(): boolean {
    return (
      typeof RTCPeerConnection === 'function' &&
      typeof navigator !== 'undefined' &&
      Boolean(navigator.mediaDevices?.getUserMedia)
    );
  }

  async connect(): Promise<void> {
    const fetchImpl = this.opts.fetchImpl ?? fetch;

    let session: RealtimeSessionInfo;
    try {
      const res = await fetchImpl(this.opts.sessionUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(this.opts.context),
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) throw new Error(`session ${res.status}`);
      session = (await res.json()) as RealtimeSessionInfo;
      if (!session.client_secret) throw new Error('no client secret');
    } catch (error) {
      this.fail('session', describe(error, "Ember's voice isn't available right now."));
      return;
    }

    try {
      this.mic = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch {
      this.fail('microphone', 'Microphone access was blocked. Allow the microphone to talk with Ember.');
      return;
    }

    try {
      const pc = new RTCPeerConnection();
      this.pc = pc;
      this.audio = document.createElement('audio');
      this.audio.autoplay = true;
      pc.ontrack = (event) => {
        if (!this.audio) return;
        this.audio.srcObject = event.streams[0];
        this.watchLevel(event.streams[0]);
      };
      this.mic.getTracks().forEach((track) => pc.addTrack(track, this.mic!));

      const channel = pc.createDataChannel('oai-events');
      this.channel = channel;
      channel.onmessage = (event) => this.handleServerEvent(String(event.data));
      channel.onopen = () => this.onOpen();
      channel.onclose = () => this.close();
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          this.fail('connection', 'The voice connection dropped.');
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const answer = await fetchImpl(`${CALLS_URL}?model=${encodeURIComponent(session.model)}`, {
        method: 'POST',
        headers: { authorization: `Bearer ${session.client_secret}`, 'content-type': 'application/sdp' },
        body: offer.sdp,
        signal: AbortSignal.timeout(15_000),
      });
      if (!answer.ok) throw new Error(`calls ${answer.status}`);
      await pc.setRemoteDescription({ type: 'answer', sdp: await answer.text() });
    } catch (error) {
      this.fail('connection', describe(error, 'Could not connect to Ember’s voice.'));
    }
  }

  /** Stop Ember mid-sentence and clear anything queued. */
  interrupt(): void {
    this.send({ type: 'response.cancel' });
    this.send({ type: 'output_audio_buffer.clear' });
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    this.channel?.close();
    this.pc?.close();
    this.mic?.getTracks().forEach((track) => track.stop());
    if (this.analyser) {
      cancelAnimationFrame(this.analyser.frame);
      void this.analyser.ctx.close();
    }
    if (this.audio) this.audio.srcObject = null;
    this.opts.onLevel(0);
    this.opts.onEvent({ type: 'closed' });
  }

  private onOpen(): void {
    this.opts.onEvent({ type: 'connected' });
    // Carry the text conversation into the voice one, so Ember does not start over.
    for (const turn of this.opts.history) {
      this.send({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: turn.role,
          content: [{ type: turn.role === 'user' ? 'input_text' : 'output_text', text: turn.content }],
        },
      });
    }
    if (this.opts.history.length === 0 && this.opts.opening) {
      this.send({
        type: 'response.create',
        response: { instructions: `Open the conversation by saying, in your own voice and pacing: "${this.opts.opening}"` },
      });
    } else if (this.opts.history.length > 0) {
      this.send({
        type: 'response.create',
        response: {
          instructions:
            'The person just switched from typing to talking. In one short sentence, acknowledge you are still here and pick up exactly where you left off. Do not summarize.',
        },
      });
    }
  }

  private handleServerEvent(raw: string): void {
    let event: { type: string; [key: string]: unknown };
    try {
      event = JSON.parse(raw) as { type: string };
    } catch {
      return;
    }
    switch (event.type) {
      case 'input_audio_buffer.speech_started':
        this.opts.onEvent({ type: 'user_speaking', speaking: true });
        break;
      case 'input_audio_buffer.speech_stopped':
        this.opts.onEvent({ type: 'user_speaking', speaking: false });
        break;
      case 'conversation.item.input_audio_transcription.completed': {
        const text = String(event.transcript ?? '').trim();
        if (text) this.opts.onEvent({ type: 'user_transcript', text });
        break;
      }
      case 'response.created':
        this.transcript = '';
        break;
      case 'response.output_audio_transcript.delta':
      case 'response.audio_transcript.delta': {
        const delta = String(event.delta ?? '');
        this.transcript += delta;
        this.opts.onEvent({ type: 'assistant_delta', text: delta });
        break;
      }
      case 'output_audio_buffer.started':
        this.opts.onEvent({ type: 'assistant_audio', playing: true });
        break;
      case 'output_audio_buffer.stopped':
      case 'output_audio_buffer.cleared':
        this.opts.onEvent({ type: 'assistant_audio', playing: false });
        break;
      case 'response.done': {
        const text = this.transcript.trim();
        this.transcript = '';
        if (text) this.opts.onEvent({ type: 'assistant_done', text });
        break;
      }
      case 'error': {
        const err = event.error as { message?: string } | undefined;
        this.opts.onEvent({ type: 'error', code: 'model', message: err?.message ?? 'The voice model reported an error.' });
        break;
      }
      default:
        break;
    }
  }

  private watchLevel(stream: MediaStream): void {
    try {
      const ctx = new AudioContext();
      const node = ctx.createAnalyser();
      node.fftSize = 512;
      node.smoothingTimeConstant = 0.5;
      ctx.createMediaStreamSource(stream).connect(node);
      const data = new Uint8Array(new ArrayBuffer(node.frequencyBinCount));
      const tick = () => {
        if (!this.analyser) return;
        node.getByteTimeDomainData(data);
        let sum = 0;
        for (const s of data) {
          const c = (s - 128) / 128;
          sum += c * c;
        }
        this.opts.onLevel(Math.min(1, Math.sqrt(sum / data.length) * 3.5));
        this.analyser.frame = requestAnimationFrame(tick);
      };
      this.analyser = { ctx, node, data, frame: requestAnimationFrame(tick) };
    } catch {
      // Level metering is cosmetic; the call works without it.
    }
  }

  private send(payload: Record<string, unknown>): void {
    if (this.channel?.readyState === 'open') this.channel.send(JSON.stringify(payload));
  }

  private fail(code: RealtimeErrorCode, message: string): void {
    this.opts.onEvent({ type: 'error', code, message });
    this.close();
  }
}

function describe(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? `${fallback} (${error.message})` : fallback;
}
