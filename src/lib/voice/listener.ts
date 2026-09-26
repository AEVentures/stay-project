import { getRecognitionCtor, type SpeechRecognitionLike } from './support';
import { type RecognitionErrorCode, type RecognitionEvent, VoiceError } from './types';

export type ListenerOptions = {
  lang?: string;
  onEvent: (event: RecognitionEvent) => void;
  win?: Window;
};

const ERROR_MAP: Record<string, RecognitionErrorCode> = {
  'not-allowed': 'not-allowed',
  'service-not-allowed': 'not-allowed',
  'no-speech': 'no-speech',
  'audio-capture': 'audio-capture',
  network: 'network',
  aborted: 'aborted',
};

/**
 * Thin, restartable wrapper over the browser's SpeechRecognition. Emits
 * interim transcripts for live captions and a final transcript per
 * utterance. Nothing leaves the browser except what the recognizer's own
 * engine does (Chrome/Edge/Safari send audio to their vendor).
 */
export class Listener {
  private recognition: SpeechRecognitionLike | null = null;
  private active = false;
  private readonly onEvent: (event: RecognitionEvent) => void;
  private readonly lang: string;
  private readonly win: Window;

  constructor(options: ListenerOptions) {
    this.onEvent = options.onEvent;
    this.lang = options.lang ?? 'en-US';
    this.win = options.win ?? window;
  }

  get listening(): boolean {
    return this.active;
  }

  start(): void {
    if (this.active) return;
    const Ctor = getRecognitionCtor(this.win);
    if (!Ctor) throw new VoiceError('unsupported', 'Speech recognition is not available in this browser.');

    const recognition = new Ctor();
    recognition.lang = this.lang;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      this.active = true;
      this.onEvent({ type: 'start' });
    };
    recognition.onresult = (event) => {
      let interim = '';
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result[0]?.transcript ?? '';
        if (result.isFinal) finalText += transcript;
        else interim += transcript;
      }
      if (finalText.trim()) this.onEvent({ type: 'final', transcript: finalText.trim() });
      else if (interim.trim()) this.onEvent({ type: 'interim', transcript: interim.trim() });
    };
    recognition.onerror = (event) => {
      const code = ERROR_MAP[event.error] ?? 'unknown';
      if (code !== 'aborted') this.onEvent({ type: 'error', code, message: event.message ?? event.error });
    };
    recognition.onend = () => {
      this.active = false;
      this.recognition = null;
      this.onEvent({ type: 'end' });
    };

    this.recognition = recognition;
    recognition.start();
  }

  stop(): void {
    this.recognition?.stop();
  }

  abort(): void {
    const current = this.recognition;
    this.recognition = null;
    this.active = false;
    current?.abort();
  }
}
