import { describe, expect, it } from 'vitest';
import { pickVoice } from './speaker';

function voice(name: string, lang: string, isDefault = false): SpeechSynthesisVoice {
  return { name, lang, default: isDefault, localService: true, voiceURI: name } as SpeechSynthesisVoice;
}

describe('pickVoice', () => {
  it('prefers the curated warm voices when present', () => {
    const voices = [voice('Alex', 'en-US', true), voice('Samantha', 'en-US'), voice('Google US English', 'en-US')];
    expect(pickVoice(voices)?.name).toBe('Samantha');
  });

  it('falls back to the default English voice, then any English voice', () => {
    expect(pickVoice([voice('Amelie', 'fr-FR'), voice('Alex', 'en-US', true)])?.name).toBe('Alex');
    expect(pickVoice([voice('Amelie', 'fr-FR'), voice('Tessa', 'en-ZA')])?.name).toBe('Tessa');
  });

  it('falls back to any voice, or null when there are none', () => {
    expect(pickVoice([voice('Amelie', 'fr-FR')])?.name).toBe('Amelie');
    expect(pickVoice([])).toBeNull();
  });
});
