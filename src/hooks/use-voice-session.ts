import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  detectVoiceSupport,
  Listener,
  MicLevel,
  Speaker,
  takeSentences,
  VoiceError,
  type RecognitionEvent,
  type SpeakerEvent,
  type VoicePhase,
  type VoiceSupport,
} from '@/lib/voice';
import type { UseCompanionChat } from './use-companion-chat';

export interface UseVoiceSessionOptions {
  chat: UseCompanionChat;
  greeting: string;
}

export interface UseVoiceSession {
  support: VoiceSupport;
  phase: VoicePhase;
  /** 0..1 — how animated Ember should be right now. */
  energy: number;
  interim: string;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
  interrupt: () => void;
}

const RESTART_DELAY_MS = 250;

/**
 * Hands-free voice loop: listen -> think -> speak -> listen, built on the
 * browser's own speech recognition and synthesis. No extra services.
 */
export function useVoiceSession({ chat, greeting }: UseVoiceSessionOptions): UseVoiceSession {
  const support = useMemo(() => detectVoiceSupport(), []);
  const [phase, setPhase] = useState<VoicePhase>('off');
  const [energy, setEnergy] = useState(0);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<string | null>(null);

  const active = useRef(false);
  const listener = useRef<Listener | null>(null);
  const speaker = useRef<Speaker | null>(null);
  const mic = useRef<MicLevel | null>(null);
  const targetEnergy = useRef(0);
  const restartTimer = useRef<number | null>(null);
  const chatRef = useRef(chat);
  chatRef.current = chat;
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  useEffect(() => {
    if (phase === 'off') return;
    let frame = 0;
    let current = 0;
    const tick = () => {
      current = Math.max(targetEnergy.current, current * 0.88);
      setEnergy(Math.round(current * 100) / 100);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [phase]);

  const listen = useCallback(() => {
    if (!active.current || !listener.current) return;
    setInterim('');
    setPhase('listening');
    try {
      listener.current.start();
    } catch (err) {
      setError(err instanceof VoiceError ? err.message : 'Could not start listening.');
      setPhase('error');
    }
  }, []);

  const scheduleListen = useCallback(() => {
    if (restartTimer.current) window.clearTimeout(restartTimer.current);
    restartTimer.current = window.setTimeout(listen, RESTART_DELAY_MS);
  }, [listen]);

  const respond = useCallback(
    async (transcript: string) => {
      if (!active.current || !speaker.current) return;
      setPhase('thinking');
      targetEnergy.current = 0.35;
      let buffer = '';
      const result = await chatRef.current.send(transcript, {
        onToken: (token) => {
          buffer += token;
          const { sentences, rest } = takeSentences(buffer);
          buffer = rest;
          sentences.forEach((sentence) => speaker.current?.speak(sentence));
        },
      });
      if (!active.current) return;
      if (result.aborted) return scheduleListen();
      if (result.offline) speaker.current.speak(result.text);
      else if (buffer.trim()) speaker.current.speak(buffer);
      if (!speaker.current.busy) scheduleListen();
    },
    [scheduleListen]
  );

  const onRecognition = useCallback(
    (event: RecognitionEvent) => {
      if (!active.current) return;
      switch (event.type) {
        case 'interim':
          setInterim(event.transcript);
          break;
        case 'final':
          setInterim(event.transcript);
          void respond(event.transcript);
          break;
        case 'end':
          if (active.current && !speaker.current?.busy && chatRef.current.status !== 'streaming') {
            scheduleListen();
          }
          break;
        case 'error':
          if (event.code === 'not-allowed') {
            setError('Microphone access was blocked. Allow the microphone to talk with Ember.');
            setPhase('error');
            active.current = false;
          } else if (event.code === 'network') {
            setError('Speech recognition lost its connection. Check your network and try again.');
            setPhase('error');
            active.current = false;
          }
          break;
        default:
          break;
      }
    },
    [respond, scheduleListen]
  );

  const onSpeaker = useCallback(
    (event: SpeakerEvent) => {
      if (event.type === 'start') {
        setPhase('speaking');
        targetEnergy.current = 0.7;
      } else if (event.type === 'word') {
        targetEnergy.current = 1;
        window.setTimeout(() => {
          targetEnergy.current = 0.55;
        }, 90);
      } else if (event.type === 'end') {
        targetEnergy.current = 0;
        if (active.current) scheduleListen();
      } else if (event.type === 'error') {
        setError(`Ember's voice failed: ${event.message}`);
      }
    },
    [scheduleListen]
  );

  const stop = useCallback(() => {
    active.current = false;
    if (restartTimer.current) window.clearTimeout(restartTimer.current);
    listener.current?.abort();
    speaker.current?.cancel();
    mic.current?.stop();
    listener.current = null;
    speaker.current = null;
    mic.current = null;
    targetEnergy.current = 0;
    setInterim('');
    setPhase('off');
  }, []);

  const start = useCallback(async () => {
    if (active.current) return;
    setError(null);
    if (!support.recognition || !support.synthesis) {
      setError('Voice needs Chrome, Edge, or Safari. Text with Ember works everywhere.');
      setPhase('error');
      return;
    }
    active.current = true;
    setPhase('starting');
    listener.current = new Listener({ onEvent: onRecognition });
    speaker.current = new Speaker({ onEvent: onSpeaker });
    mic.current = new MicLevel((level) => {
      if (phaseRef.current === 'listening') targetEnergy.current = Math.min(1, level * 1.4);
    });
    try {
      await mic.current.start();
    } catch {
      setError('Microphone access was blocked. Allow the microphone to talk with Ember.');
      setPhase('error');
      active.current = false;
      return;
    }
    const spokenBefore = chatRef.current.messages.some((m) => m.role === 'user');
    if (spokenBefore) listen();
    else speaker.current.speak(greeting);
  }, [greeting, listen, onRecognition, onSpeaker, support]);

  const interrupt = useCallback(() => {
    if (!active.current) return;
    chatRef.current.stop();
    speaker.current?.cancel();
    listen();
  }, [listen]);

  useEffect(() => stop, [stop]);

  return { support, phase, energy, interim, error, start, stop, interrupt };
}
