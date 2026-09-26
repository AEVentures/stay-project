import type { VoiceSupport } from './types';

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

export interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((event: { error: string; message?: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

export interface SpeechRecognitionResultEvent {
  resultIndex: number;
  results: ArrayLike<ArrayLike<{ transcript: string; confidence: number }> & { isFinal: boolean }>;
}

type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionCtor;
  webkitSpeechRecognition?: SpeechRecognitionCtor;
};

export function getRecognitionCtor(win: Window = window): SpeechRecognitionCtor | null {
  const w = win as SpeechWindow;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function detectVoiceSupport(win: Window | undefined = typeof window === 'undefined' ? undefined : window): VoiceSupport {
  if (!win) return { recognition: false, synthesis: false, microphone: false };
  return {
    recognition: getRecognitionCtor(win) !== null,
    synthesis:
      'speechSynthesis' in win &&
      typeof (win as Window & { SpeechSynthesisUtterance?: unknown }).SpeechSynthesisUtterance === 'function',
    microphone: Boolean(win.navigator?.mediaDevices?.getUserMedia),
  };
}
