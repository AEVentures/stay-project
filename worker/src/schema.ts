import { z } from 'zod';
import { MAX_HISTORY_MESSAGES, MAX_MESSAGE_CHARS, type WireMessage } from '../../src/lib/companion/types';

export const wireMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1).max(MAX_MESSAGE_CHARS),
});

const stringList = z.array(z.string().trim().min(1).max(160)).max(12);

export const stayPlanDeltaSchema = z
  .object({
    warningSigns: stringList,
    copingSteps: stringList,
    distractions: stringList,
    supporters: stringList,
    professionals: stringList,
    saferSpace: stringList,
    reasons: stringList,
  })
  .partial();

export const memoryDeltaSchema = z
  .object({
    name: z.string().trim().min(1).max(40).nullable(),
    people: stringList,
    carrying: stringList,
    helps: stringList,
    followUps: z.array(z.string().trim().min(1).max(160)).max(3),
    plan: stayPlanDeltaSchema,
  })
  .partial();

export type MemoryDeltaWire = z.infer<typeof memoryDeltaSchema>;

export const chatContextSchema = z
  .object({
    /** Model-facing memory summary the browser built from its encrypted store. */
    memory: z.string().trim().max(3000).nullable(),
    localHour: z.number().int().min(0).max(23).nullable(),
  })
  .partial();

export const chatRequestSchema = z.object({
  messages: z.array(wireMessageSchema).min(1).max(MAX_HISTORY_MESSAGES),
  context: chatContextSchema.optional(),
});

export const reflectRequestSchema = z.object({
  messages: z.array(wireMessageSchema).min(2).max(MAX_HISTORY_MESSAGES),
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
