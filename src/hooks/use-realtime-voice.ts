import { useCallback, useEffect, useRef, useState } from 'react';
import { RealtimeSession, type RealtimeEvent, type VoicePhase } from '@/lib/voice';
import type { UseCompanionChat } from './use-companion-chat';
import type { UseVoiceSession } from './use-voice-session';

export interface UseRealtimeVoiceOptions {
  chat: UseCompanionChat;
  sessionUrl: string;
  getContext: () => { localHour: number; memory: string | null };
  greeting: string;
  /** Called when the session cannot even be minted, so the caller can fall back. */
  onUnavailable?: () => void;
}

/**
 * Ember with Zero's voice: full-duplex speech over WebRTC. Same surface as
 * the browser-engine hook so the stage does not care which one is live.
 */
export function useRealtimeVoice({ chat, sessionUrl, getContext, greeting, onUnavailable }: UseRealtimeVoiceOptions): UseVoiceSession {
  const [phase, setPhase] = useState<VoicePhase>('off');
  const [energy, setEnergy] = useState(0);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<string | null>(null);
  const session = useRef<RealtimeSession | null>(null);
  const chatRef = useRef(chat);
  chatRef.current = chat;
  const speaking = useRef(false);
  const userSpeaking = useRef(false);
  const level = useRef(0);

  useEffect(() => {
    if (phase === 'off') return;
    let frame = 0;
    let current = 0;
    const tick = () => {
      current = Math.max(level.current, current * 0.85);
      setEnergy(Math.round(current * 100) / 100);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [phase]);

  const settlePhase = useCallback(() => {
    if (speaking.current) setPhase('speaking');
    else if (userSpeaking.current) setPhase('listening');
    else setPhase('listening');
  }, []);

  const stop = useCallback(() => {
    session.current?.close();
    session.current = null;
    speaking.current = false;
    userSpeaking.current = false;
    level.current = 0;
    setInterim('');
    setPhase('off');
  }, []);

  const onEvent = useCallback(
    (event: RealtimeEvent) => {
      switch (event.type) {
        case 'connected':
          setPhase('listening');
          break;
        case 'user_speaking':
          userSpeaking.current = event.speaking;
          if (event.speaking) {
            speaking.current = false;
            setPhase('listening');
          } else setPhase('thinking');
          break;
        case 'user_transcript':
          setInterim(event.text);
          chatRef.current.appendTurn('user', event.text);
          break;
        case 'assistant_delta':
          chatRef.current.appendAssistantDelta(event.text);
          break;
        case 'assistant_audio':
          speaking.current = event.playing;
          if (!event.playing) level.current = 0;
          settlePhase();
          break;
        case 'assistant_done':
          chatRef.current.appendTurn('assistant', event.text);
          setInterim('');
          break;
        case 'error':
          if (event.code === 'session') onUnavailable?.();
          setError(event.message);
          setPhase('error');
          break;
        case 'closed':
          if (session.current) {
            session.current = null;
            setPhase((p) => (p === 'error' ? p : 'off'));
          }
          break;
        default:
          break;
      }
    },
    [onUnavailable, settlePhase]
  );

  const start = useCallback(async () => {
    if (session.current) return;
    setError(null);
    if (!RealtimeSession.supported()) {
      setError('This browser cannot open a live voice call. Text with Ember works everywhere.');
      setPhase('error');
      return;
    }
    setPhase('starting');
    const history = chatRef.current.toWire();
    const rt = new RealtimeSession({
      sessionUrl,
      context: getContext(),
      history,
      opening: history.length === 0 ? greeting : null,
      onEvent,
      onLevel: (value) => {
        level.current = speaking.current ? value : 0;
      },
    });
    session.current = rt;
    await rt.connect();
  }, [getContext, greeting, onEvent, sessionUrl]);

  const interrupt = useCallback(() => {
    session.current?.interrupt();
    speaking.current = false;
    level.current = 0;
    setPhase('listening');
  }, []);

  useEffect(() => stop, [stop]);

  return {
    support: { recognition: true, synthesis: true, microphone: RealtimeSession.supported() },
    phase,
    energy,
    interim,
    error,
    start,
    stop,
    interrupt,
  };
}
