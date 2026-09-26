/**
 * Splits streamed text into speakable sentences so Ember can start talking
 * before the whole reply has arrived. Returns complete sentences and the
 * unfinished remainder.
 */
export function takeSentences(buffer: string): { sentences: string[]; rest: string } {
  const sentences: string[] = [];
  let rest = buffer;
  const pattern = /^([\s\S]*?[.!?…]+["')\]]*)(?=\s+|\n|$)/;

  for (;;) {
    const match = pattern.exec(rest);
    if (!match || match[1].length === rest.length) break;
    const sentence = match[1].trim();
    if (sentence) sentences.push(sentence);
    rest = rest.slice(match[0].length).replace(/^\s+/, '');
  }

  const paragraphs = rest.split(/\n{2,}/);
  if (paragraphs.length > 1) {
    for (const paragraph of paragraphs.slice(0, -1)) {
      const trimmed = paragraph.trim();
      if (trimmed) sentences.push(trimmed);
    }
    rest = paragraphs[paragraphs.length - 1];
  }

  return { sentences, rest };
}

/** Strip markdown-ish noise so the synthesizer does not read symbols aloud. */
export function toSpeakable(text: string): string {
  return text
    .replace(/[*_`#>]+/g, '')
    .replace(/^\s*[-•]\s+/gm, '')
    .replace(/\b988\b/g, 'nine eight eight')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Clause-level chunks for a more human cadence: browser synthesizers barely
 * pause at commas, so we split there and let the Speaker breathe between.
 */
export function toClauses(sentence: string): string[] {
  const parts = sentence
    .replace(/\s+[—–]\s+/g, ', ')
    .split(/(?<=[,;:])\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const merged: string[] = [];
  for (const part of parts) {
    const last = merged[merged.length - 1];
    if (last && (last.split(' ').length < 3 || part.split(' ').length < 2)) merged[merged.length - 1] = `${last} ${part}`;
    else merged.push(part);
  }
  return merged.length ? merged : [sentence];
}
