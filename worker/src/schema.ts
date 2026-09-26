import { z } from 'zod';
import { MAX_HISTORY_MESSAGES, MAX_MESSAGE_CHARS, type WireMessage } from '../../src/lib/companion/types';

export const wireMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1).max(MAX_MESSAGE_CHARS),
});

export const chatRequestSchema = z.object({
  messages: z.array(wireMessageSchema).min(1).max(MAX_HISTORY_MESSAGES),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;

/**
 * Anthropic requires the conversation to start with a user turn and end
 * with one. Consecutive same-role turns are merged so scripted openers or
 * dropped replies never break the request.
 */
export function normalizeHistory(messages: readonly WireMessage[]): WireMessage[] {
  const merged: WireMessage[] = [];
  for (const message of messages) {
    const last = merged[merged.length - 1];
    if (last && last.role === message.role) {
      last.content = `${last.content}\n\n${message.content}`;
    } else {
      merged.push({ ...message });
    }
  }
  while (merged.length && merged[0].role !== 'user') merged.shift();
  while (merged.length && merged[merged.length - 1].role !== 'user') merged.pop();
  return merged;
}

export function userTexts(messages: readonly WireMessage[]): string[] {
  return messages.filter((m) => m.role === 'user').map((m) => m.content);
}
