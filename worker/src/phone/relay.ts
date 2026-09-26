import { assessConversationRisk } from '../../../src/lib/companion/safety';
import type { RiskLevel, WireMessage } from '../../../src/lib/companion/types';
import { openCompletion, readTextDeltas } from '../anthropic';
import type { Config } from '../env';
import type { Logger } from '../logger';
import { buildSystemPrompt } from '../prompt';
import { normalizeHistory } from '../schema';
import { PHONE_GREETING } from './twiml';

/** Messages Twilio ConversationRelay sends us. */
export type RelayInbound =
  | { type: 'setup'; sessionId?: string; callSid?: string; from?: string; to?: string }
  | { type: 'prompt'; voicePrompt: string; lang?: string; last?: boolean }
  | { type: 'interrupt'; utteranceUntilInterrupt?: string; durationUntilInterruptMs?: number }
  | { type: 'dtmf'; digit?: string }
  | { type: 'error'; description?: string }
  | { type: string };

/** Messages we send back. */
export type RelayOutbound =
  | { type: 'text'; token: string; last: boolean }
  | { type: 'end'; handoffData?: string };

export type RelaySessionDeps = {
  config: Config;
  log: Logger;
  send: (message: RelayOutbound) => void;
  fetchImpl?: typeof fetch;
};

export const PHONE_GUIDANCE = `THIS IS A PHONE CALL. Your words are spoken aloud by a text-to-speech voice.
- Keep every reply to one to three short sentences. Pauses are fine; the person can always say more.
- No lists, no markdown, no symbols. Say "nine eight eight" instead of "988" when you mention the crisis line, and say it slowly, once per reply at most.
- If the person is quiet, gently check in rather than filling the silence.
- If you are interrupted, drop what you were saying and listen.`;

const MAX_TURNS = 40;

/**
 * One live phone conversation. Transport-agnostic: the WebSocket route feeds
 * `handle()` and receives text tokens through `send`. Tests drive it directly.
 */
export class RelaySession {
  private readonly history: WireMessage[] = [{ role: 'assistant', content: PHONE_GREETING }];
  private current: AbortController | null = null;
  private queue: Promise<void> = Promise.resolve();
  private risk: RiskLevel = 'none';

  constructor(private readonly deps: RelaySessionDeps) {}

  get currentRisk(): RiskLevel {
    return this.risk;
  }

  handle(message: RelayInbound): Promise<void> {
    switch (message.type) {
      case 'setup':
        this.deps.log.info('phone_setup', { callSid: (message as { callSid?: string }).callSid ?? null });
        return Promise.resolve();
      case 'prompt': {
        const prompt = message as { voicePrompt?: string; last?: boolean };
        if (prompt.last === false || !prompt.voicePrompt?.trim()) return Promise.resolve();
        this.queue = this.queue.then(() => this.respond(prompt.voicePrompt!.trim()));
        return this.queue;
      }
      case 'interrupt':
        this.current?.abort();
        return Promise.resolve();
      case 'error':
        this.deps.log.warn('phone_relay_error', { description: (message as { description?: string }).description ?? null });
        return Promise.resolve();
      default:
        return Promise.resolve();
    }
  }

  close(): void {
    this.current?.abort();
  }

  private async respond(userText: string): Promise<void> {
    this.history.push({ role: 'user', content: userText });
    while (this.history.length > MAX_TURNS) this.history.shift();
    this.risk = assessConversationRisk(this.history.filter((m) => m.role === 'user').map((m) => m.content));

    const controller = new AbortController();
    this.current = controller;
    const started = Date.now();
    let spoken = '';

    try {
      const upstream = await openCompletion({
        config: { ...this.deps.config, maxOutputTokens: Math.min(this.deps.config.maxOutputTokens, 220) },
        system: `${buildSystemPrompt(this.risk)}\n\n${PHONE_GUIDANCE}`,
        messages: normalizeHistory(this.history),
        signal: controller.signal,
        fetchImpl: this.deps.fetchImpl,
      });
      for await (const token of readTextDeltas(upstream.body!)) {
        if (controller.signal.aborted) break;
        spoken += token;
        this.deps.send({ type: 'text', token, last: false });
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        this.deps.log.error('phone_upstream_failed', { message: error instanceof Error ? error.message : 'unknown' });
        spoken = fallbackLine(this.risk);
        this.deps.send({ type: 'text', token: spoken, last: false });
      }
    } finally {
      if (!controller.signal.aborted) this.deps.send({ type: 'text', token: '', last: true });
      if (spoken.trim()) this.history.push({ role: 'assistant', content: spoken.trim() });
      this.deps.log.info('phone_turn', { risk: this.risk, durationMs: Date.now() - started, interrupted: controller.signal.aborted });
      if (this.current === controller) this.current = null;
    }
  }
}

export function fallbackLine(risk: RiskLevel): string {
  if (risk === 'imminent') {
    return "I'm having trouble finding my words, and this matters too much to wait on me. Please hang up and call nine eight eight right now, or your local emergency number. A real person will answer.";
  }
  if (risk === 'elevated') {
    return "I lost my words for a second, but I'm still here. You don't have to carry this alone. Nine eight eight will connect you with a trained person any hour, and I'm glad you're talking.";
  }
  return "I'm having a little trouble hearing myself think. I'm still here. Take a slow breath with me, and tell me again what's on your mind.";
}
