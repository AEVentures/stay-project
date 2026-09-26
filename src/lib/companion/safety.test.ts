import { describe, expect, it } from 'vitest';
import { assessConversationRisk, assessRisk, maxRisk } from './safety';

describe('assessRisk', () => {
  it.each([
    '',
    '   ',
    'I had a rough day at work and I feel tired.',
    'My dog died last year and I still miss him.',
    'Can you help me get through the next few minutes?',
    'I killed it at my presentation today',
  ])('returns none for non-risk text: %j', (text) => {
    expect(assessRisk(text)).toBe('none');
  });

  it.each([
    "I've been feeling suicidal lately",
    'sometimes i want to die',
    "I don't want to be here anymore",
    'everyone would be better off without me',
    'I keep cutting myself',
    "I can't do this anymore",
    'no one would miss me',
    'I wish I was never born',
  ])('returns elevated for ideation: %j', (text) => {
    expect(assessRisk(text)).toBe('elevated');
  });

  it.each([
    "I'm going to kill myself tonight",
    'i am about to end it',
    'I just took all of the pills',
    'this is my goodbye note',
    'goodbye everyone, forever',
    "I'm standing on the bridge",
    'nobody can stop me',
    'ending my life today',
  ])('returns imminent for intent with plan or timing: %j', (text) => {
    expect(assessRisk(text)).toBe('imminent');
  });

  it('collapses whitespace before matching', () => {
    expect(assessRisk("I'm   going\n\nto  kill  myself tonight")).toBe('imminent');
  });
});

describe('maxRisk', () => {
  it('returns the highest level', () => {
    expect(maxRisk()).toBe('none');
    expect(maxRisk('none', 'elevated')).toBe('elevated');
    expect(maxRisk('elevated', 'imminent', 'none')).toBe('imminent');
  });
});

describe('assessConversationRisk', () => {
  it('considers only the recent window of user messages', () => {
    const history = ["I'm going to kill myself tonight", ...Array(6).fill('feeling calmer now')];
    expect(assessConversationRisk(history)).toBe('none');
    expect(assessConversationRisk(history, 10)).toBe('imminent');
  });

  it('keeps elevated risk visible within the window', () => {
    expect(assessConversationRisk(['i want to die', 'ok', 'thanks'])).toBe('elevated');
  });
});
