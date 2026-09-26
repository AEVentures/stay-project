import { describe, expect, it } from 'vitest';
import { chatRequestSchema, normalizeHistory } from './schema';

describe('chatRequestSchema', () => {
  it('accepts a valid conversation', () => {
    const result = chatRequestSchema.safeParse({ messages: [{ role: 'user', content: ' hi ' }] });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.messages[0].content).toBe('hi');
  });

  it.each([
    {},
    { messages: [] },
    { messages: [{ role: 'system', content: 'x' }] },
    { messages: [{ role: 'user', content: '' }] },
    { messages: [{ role: 'user', content: 'a'.repeat(2001) }] },
    { messages: Array(31).fill({ role: 'user', content: 'x' }) },
  ])('rejects malformed input %#', (input) => {
    expect(chatRequestSchema.safeParse(input).success).toBe(false);
  });
});

describe('normalizeHistory', () => {
  it('drops a leading scripted assistant greeting', () => {
    expect(
      normalizeHistory([
        { role: 'assistant', content: 'hello' },
        { role: 'user', content: 'hi' },
      ])
    ).toEqual([{ role: 'user', content: 'hi' }]);
  });

  it('merges consecutive same-role turns', () => {
    expect(
      normalizeHistory([
        { role: 'user', content: 'a' },
        { role: 'user', content: 'b' },
        { role: 'assistant', content: 'c' },
        { role: 'user', content: 'd' },
      ])
    ).toEqual([
      { role: 'user', content: 'a\n\nb' },
      { role: 'assistant', content: 'c' },
      { role: 'user', content: 'd' },
    ]);
  });

  it('drops trailing assistant turns and returns empty when no user turn exists', () => {
    expect(
      normalizeHistory([
        { role: 'user', content: 'a' },
        { role: 'assistant', content: 'b' },
      ])
    ).toEqual([{ role: 'user', content: 'a' }]);
    expect(normalizeHistory([{ role: 'assistant', content: 'b' }])).toEqual([]);
  });

  it('does not mutate its input', () => {
    const input = [
      { role: 'user' as const, content: 'a' },
      { role: 'user' as const, content: 'b' },
    ];
    normalizeHistory(input);
    expect(input[0].content).toBe('a');
  });
});
