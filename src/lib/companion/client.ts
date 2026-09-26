import { CompanionError, type StreamEvent, type WireMessage } from './types';

export type ChatContext = {
  memory?: string | null;
  localHour?: number | null;
};

export type StreamOptions = {
  apiUrl: string;
  messages: readonly WireMessage[];
  context?: ChatContext;
  onToken: (text: string) => void;
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
  /** Retries apply only to connection failures before any token arrives. */
  maxRetries?: number;
  baseDelayMs?: number;
};

const RETRYABLE_STATUS = new Set([502, 503, 504]);

export async function streamCompanionReply(options: StreamOptions): Promise<string> {
  const {
    apiUrl,
    messages,
    context,
    onToken,
    signal,
    fetchImpl = fetch,
    maxRetries = 2,
    baseDelayMs = 400,
  } = options;

  if (!apiUrl) {
    throw new CompanionError('not_configured', 'Companion API URL is not configured.');
  }

  let attempt = 0;
  for (;;) {
    try {
      const response = await openStream(apiUrl, messages, context, fetchImpl, signal);
      return await consumeStream(response, onToken, signal);
    } catch (error) {
      if (signal?.aborted) throw new CompanionError('aborted', 'Request cancelled.');
      const retryable = isRetryable(error);
      if (!retryable || attempt >= maxRetries) throw normalize(error);
      await delay(baseDelayMs * 2 ** attempt + Math.random() * 100, signal);
      attempt += 1;
    }
  }
}

async function openStream(
  apiUrl: string,
  messages: readonly WireMessage[],
  context: ChatContext | undefined,
  fetchImpl: typeof fetch,
  signal?: AbortSignal
): Promise<Response> {
  let response: Response;
  try {
    response = await fetchImpl(`${apiUrl.replace(/\/$/, '')}/v1/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'text/event-stream' },
      body: JSON.stringify(context ? { messages, context } : { messages }),
      signal,
    });
  } catch (error) {
    throw new RetryableError(new CompanionError('network', describe(error)));
  }

  if (response.status === 429) {
    throw new CompanionError('rate_limited', 'Too many messages in a short time.');
  }
  if (!response.ok) {
    const failure = new CompanionError('server', `Companion service returned ${response.status}.`);
    throw RETRYABLE_STATUS.has(response.status) ? new RetryableError(failure) : failure;
  }
  if (!response.body) {
    throw new RetryableError(new CompanionError('server', 'Companion service sent an empty body.'));
  }
  return response;
}

async function consumeStream(
  response: Response,
  onToken: (text: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';

  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const frames = buffer.split('\n\n');
      buffer = frames.pop() ?? '';
      for (const frame of frames) {
        const event = parseFrame(frame);
        if (!event) continue;
        if (event.type === 'token') {
          full += event.text;
          onToken(event.text);
        } else if (event.type === 'error') {
          throw new CompanionError(
            event.code === 'rate_limited' ? 'rate_limited' : 'server',
            event.message
          );
        } else if (event.type === 'done') {
          return full;
        }
      }
    }
  } finally {
    if (signal?.aborted) await reader.cancel().catch(() => undefined);
  }

  return full;
}

export function parseFrame(frame: string): StreamEvent | null {
  const data = frame
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trim())
    .join('\n');
  if (!data) return null;
  try {
    const parsed: unknown = JSON.parse(data);
    return isStreamEvent(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function isStreamEvent(value: unknown): value is StreamEvent {
  if (typeof value !== 'object' || value === null || !('type' in value)) return false;
  const type = (value as { type: unknown }).type;
  if (type === 'token') return typeof (value as { text?: unknown }).text === 'string';
  if (type === 'done') return true;
  if (type === 'error') {
    const candidate = value as { code?: unknown; message?: unknown };
    return typeof candidate.code === 'string' && typeof candidate.message === 'string';
  }
  return false;
}

class RetryableError extends Error {
  constructor(readonly cause: CompanionError) {
    super(cause.message);
    this.name = 'RetryableError';
  }
}

function isRetryable(error: unknown): error is RetryableError {
  return error instanceof RetryableError;
}

function normalize(error: unknown): CompanionError {
  if (error instanceof RetryableError) return error.cause;
  if (error instanceof CompanionError) return error;
  return new CompanionError('server', describe(error));
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new CompanionError('aborted', 'Request cancelled.'));
      },
      { once: true }
    );
  });
}

/**
 * Asks the worker to distill a conversation into a memory delta. Best-effort:
 * failures return null and the conversation is unaffected.
 */
export async function reflectConversation(
  apiUrl: string,
  messages: readonly WireMessage[],
  fetchImpl: typeof fetch = fetch
): Promise<unknown | null> {
  if (!apiUrl || messages.length < 2) return null;
  try {
    const response = await fetchImpl(`${apiUrl.replace(/\/$/, '')}/v1/reflect`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ messages }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) return null;
    const json = (await response.json()) as { delta?: unknown };
    return json.delta ?? null;
  } catch {
    return null;
  }
}
