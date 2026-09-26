import { toClauses, toSpeakable } from './sentences';
import type { SpeakerEvent } from './types';

export type SpeakerOptions = {
  onEvent: (event: SpeakerEvent) => void;
  lang?: string;
  rate?: number;
  pitch?: number;
  synth?: SpeechSynthesis;
};

/** Voices that sound warm and steady, in order of preference, per platform. */
const PREFERRED_VOICES = [
  'Samantha',
  'Google US English',
  'Microsoft Aria Online (Natural) - English (United States)',
  'Microsoft Jenny Online (Natural) - English (United States)',
  'Karen',
  'Moira',
  'Daniel',
];

export function pickVoice(voices: readonly SpeechSynthesisVoice[], lang = 'en'): SpeechSynthesisVoice | null {
  const english = voices.filter((voice) => voice.lang.toLowerCase().startsWith(lang.toLowerCase()));
  for (const name of PREFERRED_VOICES) {
    const match = english.find((voice) => voice.name === name);
    if (match) return match;
  }
  return english.find((voice) => voice.default) ?? english[0] ?? voices[0] ?? null;
}

/**
 * Queue-based wrapper over SpeechSynthesis. Utterances are spoken in order;
 * `cancel()` clears everything (used when the user interrupts Ember).
 */
export class Speaker {
  private readonly synth: SpeechSynthesis;
  private readonly onEvent: (event: SpeakerEvent) => void;
  private readonly lang: string;
  private readonly rate: number;
  private readonly pitch: number;
  private pending = 0;
  private speakingStarted = false;
  private pauseUntil = 0;
  private voice: SpeechSynthesisVoice | null = null;

  constructor(options: SpeakerOptions) {
    this.synth = options.synth ?? window.speechSynthesis;
    this.onEvent = options.onEvent;
    this.lang = options.lang ?? 'en-US';
    this.rate = options.rate ?? 0.96;
    this.pitch = options.pitch ?? 1.02;
    this.refreshVoice();
    this.synth.addEventListener?.('voiceschanged', () => this.refreshVoice());
  }

  get busy(): boolean {
    return this.pending > 0;
  }

  /** Speaks a sentence as breathing clauses with small pauses between them. */
  speak(text: string): void {
    const speakable = toSpeakable(text);
    if (!speakable) return;
    const clauses = toClauses(speakable);
    clauses.forEach((clause, index) => this.enqueue(clause, index === clauses.length - 1 ? 260 : 140));
  }

  private enqueue(speakable: string, pauseAfterMs: number): void {
    const utterance = new SpeechSynthesisUtterance(speakable);
    utterance.lang = this.lang;
    utterance.rate = this.rate;
    utterance.pitch = this.pitch;
    if (this.voice) utterance.voice = this.voice;

    utterance.onstart = () => {
      if (!this.speakingStarted) {
        this.speakingStarted = true;
        this.onEvent({ type: 'start' });
      }
    };
    utterance.onboundary = (event) => {
      if (event.name === 'word') this.onEvent({ type: 'word', charIndex: event.charIndex });
    };
    utterance.onend = () => {
      this.pauseUntil = Date.now() + pauseAfterMs;
      this.settle();
    };
    utterance.onerror = (event) => {
      if (event.error !== 'interrupted' && event.error !== 'canceled') {
        this.onEvent({ type: 'error', message: event.error });
      }
      this.settle();
    };

    this.pending += 1;
    const wait = Math.max(0, this.pauseUntil - Date.now());
    if (wait > 0 && this.pending === 1) window.setTimeout(() => this.synth.speak(utterance), wait);
    else this.synth.speak(utterance);
  }

  cancel(): void {
    this.pending = 0;
    this.synth.cancel();
    if (this.speakingStarted) {
      this.speakingStarted = false;
      this.onEvent({ type: 'end' });
    }
  }

  private settle(): void {
    this.pending = Math.max(0, this.pending - 1);
    if (this.pending === 0 && this.speakingStarted) {
      this.speakingStarted = false;
      this.onEvent({ type: 'end' });
    }
  }

  private refreshVoice(): void {
    this.voice = pickVoice(this.synth.getVoices(), this.lang.slice(0, 2));
  }
}
