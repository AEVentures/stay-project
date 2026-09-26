export type VoiceSupport = {
  recognition: boolean;
  synthesis: boolean;
  microphone: boolean;
};

export type RecognitionEvent =
  | { type: 'start' }
  | { type: 'interim'; transcript: string }
  | { type: 'final'; transcript: string }
  | { type: 'end' }
  | { type: 'error'; code: RecognitionErrorCode; message: string };

export type RecognitionErrorCode =
  | 'not-allowed'
  | 'no-speech'
  | 'audio-capture'
  | 'network'
  | 'aborted'
  | 'unsupported'
  | 'unknown';

export type SpeakerEvent =
  | { type: 'start' }
  | { type: 'word'; charIndex: number }
  | { type: 'end' }
  | { type: 'error'; message: string };

export type VoicePhase = 'off' | 'starting' | 'listening' | 'thinking' | 'speaking' | 'error';

export class VoiceError extends Error {
  readonly code: RecognitionErrorCode;

  constructor(code: RecognitionErrorCode, message: string) {
    super(message);
    this.name = 'VoiceError';
    this.code = code;
  }
}
