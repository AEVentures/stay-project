import { describe, expect, it } from 'vitest';
import { buildSystemPrompt, EMBER_SYSTEM_PROMPT, riskGuidance } from './prompt';

describe('Ember system prompt', () => {
  it('states the character is not human and not a clinician', () => {
    expect(EMBER_SYSTEM_PROMPT).toMatch(/not a person, not a therapist/i);
    expect(EMBER_SYSTEM_PROMPT).toMatch(/never claim to be human/i);
  });

  it('forbids means and method discussion and names 988', () => {
    expect(EMBER_SYSTEM_PROMPT).toMatch(/never describe.*methods, means, lethality/i);
    expect(EMBER_SYSTEM_PROMPT).toContain('988');
  });

  it('follows safe messaging language guidance', () => {
    expect(EMBER_SYSTEM_PROMPT).toMatch(/never use "commit suicide"/i);
    expect(EMBER_SYSTEM_PROMPT).toMatch(/suicide is selfish/i);
  });

  it('escalates guidance with risk', () => {
    expect(riskGuidance('none')).toMatch(/NONE DETECTED/);
    expect(riskGuidance('elevated')).toMatch(/ELEVATED/);
    expect(riskGuidance('imminent')).toMatch(/IMMINENT/);
    expect(riskGuidance('imminent')).toMatch(/emergency services/i);
    expect(buildSystemPrompt('imminent')).toContain(EMBER_SYSTEM_PROMPT);
    expect(buildSystemPrompt('imminent')).toContain(riskGuidance('imminent'));
  });
});
