import { describe, expect, it } from 'vitest';
import { takeSentences, toSpeakable } from './sentences';

describe('takeSentences', () => {
  it('returns nothing for an unfinished sentence', () => {
    expect(takeSentences('I hear you and')).toEqual({ sentences: [], rest: 'I hear you and' });
  });

  it('extracts complete sentences and keeps the remainder', () => {
    expect(takeSentences('I hear you. That sounds heavy! What is the')).toEqual({
      sentences: ['I hear you.', 'That sounds heavy!'],
      rest: 'What is the',
    });
  });

  it('holds a trailing sentence until more text confirms it ended', () => {
    // "988." could be "988.5" mid-stream; a sentence is only final when followed by space/newline/end-of-buffer
    // and not the whole buffer.
    expect(takeSentences('Call 988.')).toEqual({ sentences: [], rest: 'Call 988.' });
    expect(takeSentences('Call 988. ')).toEqual({ sentences: ['Call 988.'], rest: '' });
  });

  it('treats paragraph breaks as boundaries even without punctuation', () => {
    expect(takeSentences('Breathe in for four\n\nOut for six')).toEqual({
      sentences: ['Breathe in for four'],
      rest: 'Out for six',
    });
  });

  it('handles closing quotes after punctuation', () => {
    expect(takeSentences('You said, "I am tired." That matters')).toEqual({
      sentences: ['You said, "I am tired."'],
      rest: 'That matters',
    });
  });
});

describe('toSpeakable', () => {
  it('strips markdown and bullets and spells out 988', () => {
    expect(toSpeakable('• **Call 988** now\n- breathe')).toBe('Call nine eight eight now breathe');
  });

  it('leaves other numbers alone', () => {
    expect(toSpeakable('Text HOME to 741741')).toBe('Text HOME to 741741');
  });
});
