import type { StreamEvent, WireMessage } from '../../src/lib/companion/types';
import type { Config } from './env';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const RETRYABLE_STATUS = new Set([408, 409, 425, 429, 500, 502, 503, 504, 529]);

export type UpstreamErrorCode = 'upstream_unavailable' | 'upstream_rate_limited' | 'upstream_rejected';

export class UpstreamError extends Error {
  constructor(
    readonly code: UpstreamErrorCode,
    readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'UpstreamError';
  }
}

export type CompletionRequest = {
  config: Config;
  system: string;
  messages: readonly WireMessage[];
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
  maxRetries?: number;
  baseDelayMs?: number;
};

/** Opens a streaming completion, retrying transient failures before any byte is read. */
export async function openCompletion(request: CompletionRequest): Promise<Response> {
  const { config, system, messages, signal, fetchImpl = fetch, maxRetries = 2, baseDelayMs = 300 } = request;
  const body = JSON.stringify({
    model: config.model,
    max_tokens: config.maxOutputTokens,
    system,
    messages,
    stream: true,
    temperature: 0.6,
  });

  let attempt = 0;
  for (;;) {
    let response: Response | null = null;
    try {
      response = await fetchImpl(ANTHROPIC_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': ANTHROPIC_VERSION,
          accept: 'text/event-stream',
        },
        body,
        signal,
      });
    } catch (error) {
      if (signal?.aborted) throw error;
    }

    if (response?.ok && response.body) return response;

    const status = response?.status ?? 0;
    const retryable = response === null || RETRYABLE_STATUS.has(status);
    if (!retryable || attempt >= maxRetries) throw toUpstreamError(status, response);

    const retryAfter = Number(response?.headers.get('retry-after'));
    const wait = Number.isFinite(retryAfter) && retryAfter > 0
      ? Math.min(retryAfter * 1000, 5000)
      : baseDelayMs * 2 ** attempt + Math.random() * 100;
    await new Promise((resolve) => setTimeout(resolve, wait));
    attempt += 1;
  }
}

function toUpstreamError(status: number, response: Response | null): UpstreamError {
  if (status === 429) return new UpstreamError('upstream_rate_limited', status, 'Model is rate limited.');
  if (response === null || status >= 500 || status === 0) {
    return new UpstreamError('upstream_unavailable', status, 'Model service is unavailable.');
  }
  return new UpstreamError('upstream_rejected', status, `Model rejected the request (${status}).`);
}

type AnthropicEvent =
  | { type: 'content_block_delta'; delta: { type: 'text_delta'; text: string } | { type: string } }
  | { type: 'message_stop' }
  | { type: 'error'; error: { type: string; message: string } }
  | { type: string };

/**
 * Translates Anthropic's SSE stream into Ember's minimal event protocol.
 * Only text deltas cross the boundary; nothing about the upstream provider
 * leaks to the browser.
 */
export function translateStream(upstream: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';
  let finished = false;

  const emit = (controller: TransformStreamDefaultController<Uint8Array>, event: StreamEvent) => {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
  };

  const transform = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true });
      const frames = buffer.split('\n\n');
      buffer = frames.pop() ?? '';
      for (const frame of frames) {
        const event = parseAnthropicFrame(frame);
        if (!event) continue;
        if (event.type === 'content_block_delta') {
          const delta = (event as { delta: { type: string; text?: string } }).delta;
          if (delta.type === 'text_delta' && delta.text) emit(controller, { type: 'token', text: delta.text });
        } else if (event.type === 'message_stop') {
          finished = true;
          emit(controller, { type: 'done' });
        } else if (event.type === 'error') {
          finished = true;
          emit(controller, { type: 'error', code: 'upstream', message: 'The model stopped responding.' });
        }
      }
    },
    flush(controller) {
      if (!finished) emit(controller, { type: 'done' });
    },
  });

  return upstream.pipeThrough(transform);
}

/** Yields text deltas from an Anthropic SSE body (used by the phone relay). */
export async function* readTextDeltas(upstream: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = upstream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const frames = buffer.split('\n\n');
      buffer = frames.pop() ?? '';
      for (const frame of frames) {
        const event = parseAnthropicFrame(frame);
        if (!event) continue;
        if (event.type === 'content_block_delta') {
          const delta = (event as { delta: { type: string; text?: string } }).delta;
          if (delta.type === 'text_delta' && delta.text) yield delta.text;
        } else if (event.type === 'message_stop' || event.type === 'error') {
          return;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export function parseAnthropicFrame(frame: string): AnthropicEvent | null {
  const data = frame
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trim())
    .join('');
  if (!data) return null;
  try {
    const parsed: unknown = JSON.parse(data);
    return typeof parsed === 'object' && parsed !== null && 'type' in parsed
      ? (parsed as AnthropicEvent)
      : null;
  } catch {
    return null;
  }
}
