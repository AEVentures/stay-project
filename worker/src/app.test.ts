import { describe, expect, it, vi } from 'vitest';
import { createApp } from './app';
import type { Env } from './env';

const ORIGIN = 'https://aeventures.github.io';

function anthropicStream(frames: string[]): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const frame of frames) controller.enqueue(encoder.encode(frame));
      controller.close();
    },
  });
  return new Response(body, { status: 200, headers: { 'content-type': 'text/event-stream' } });
}

function env(overrides: Partial<Env> = {}): Env {
  return {
    ANTHROPIC_API_KEY: 'test-key',
    ALLOWED_ORIGINS: `${ORIGIN},http://localhost:5173`,
    ...overrides,
  };
}

function chatRequest(body: unknown, origin = ORIGIN): Request {
  return new Request('https://worker.test/v1/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin },
    body: JSON.stringify(body),
  });
}

const hello = { messages: [{ role: 'user', content: 'hello' }] };

describe('GET /health', () => {
  it('reports ok when configured and degraded otherwise', async () => {
    const app = createApp();
    const ok = await app.request('/health', {}, env());
    expect(ok.status).toBe(200);
    expect(await ok.json()).toMatchObject({ status: 'ok', configured: true });

    const degraded = await app.request('/health', {}, env({ ANTHROPIC_API_KEY: '' }));
    expect(degraded.status).toBe(503);
    expect(await degraded.json()).toMatchObject({ status: 'degraded' });
  });

  it('sets security headers and a request id', async () => {
    const res = await createApp().request('/health', {}, env());
    expect(res.headers.get('x-request-id')).toBeTruthy();
    expect(res.headers.get('content-security-policy')).toContain("default-src 'none'");
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
  });
});

describe('POST /v1/chat', () => {
  it('streams translated tokens from the model and never leaks the API key', async () => {
    const fetchImpl = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const headers = init?.headers as Record<string, string>;
      expect(headers['x-api-key']).toBe('test-key');
      const body = JSON.parse(init?.body as string) as { system: string; messages: unknown[]; stream: boolean };
      expect(body.stream).toBe(true);
      expect(body.system).toContain('You are Ember');
      expect(body.messages).toEqual([{ role: 'user', content: 'hello' }]);
      return anthropicStream([
        'event: message_start\ndata: {"type":"message_start"}\n\n',
        'event: content_block_delta\ndata: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hi "}}\n\n',
        'event: content_block_delta\ndata: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"there."}}\n\n',
        'event: message_stop\ndata: {"type":"message_stop"}\n\n',
      ]);
    });

    const app = createApp({ fetchImpl: fetchImpl as unknown as typeof fetch });
    const res = await app.request(chatRequest(hello), undefined, env());

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/event-stream');
    expect(res.headers.get('access-control-allow-origin')).toBe(ORIGIN);
    const text = await res.text();
    expect(text).not.toContain('test-key');
    expect(text).toBe(
      'data: {"type":"token","text":"Hi "}\n\n' +
        'data: {"type":"token","text":"there."}\n\n' +
        'data: {"type":"done"}\n\n'
    );
  });

  it('injects imminent-risk guidance when the conversation warrants it', async () => {
    let system = '';
    const fetchImpl = vi.fn(async (_url: unknown, init?: RequestInit) => {
      system = (JSON.parse(init?.body as string) as { system: string }).system;
      return anthropicStream(['data: {"type":"message_stop"}\n\n']);
    });
    const app = createApp({ fetchImpl: fetchImpl as unknown as typeof fetch });
    await app.request(
      chatRequest({ messages: [{ role: 'user', content: "I'm going to kill myself tonight" }] }),
      undefined,
      env()
    );
    expect(system).toMatch(/CURRENT RISK ASSESSMENT: IMMINENT/);
  });

  it('rejects disallowed origins and malformed bodies', async () => {
    const app = createApp({ fetchImpl: vi.fn() as unknown as typeof fetch });
    const forbidden = await app.request(chatRequest(hello, 'https://evil.example'), undefined, env());
    expect(forbidden.status).toBe(403);

    const bad = await app.request(chatRequest({ messages: [{ role: 'user', content: '' }] }), undefined, env());
    expect(bad.status).toBe(400);

    const onlyAssistant = await app.request(
      chatRequest({ messages: [{ role: 'assistant', content: 'hi' }] }),
      undefined,
      env()
    );
    expect(onlyAssistant.status).toBe(400);
  });

  it('returns 503 when the API key is missing', async () => {
    const res = await createApp().request(chatRequest(hello), undefined, env({ ANTHROPIC_API_KEY: '' }));
    expect(res.status).toBe(503);
  });

  it('enforces the rate limiter binding', async () => {
    const limiter = { limit: vi.fn(async () => ({ success: false })) };
    const res = await createApp().request(
      chatRequest(hello),
      undefined,
      env({ CHAT_RATE_LIMITER: limiter as unknown as RateLimit })
    );
    expect(res.status).toBe(429);
    expect(limiter.limit).toHaveBeenCalledWith({ key: 'anonymous' });
  });

  it('retries transient upstream failures, then emits an SSE error frame if they persist', async () => {
    const fetchImpl = vi.fn(async () => new Response('overloaded', { status: 529 }));
    const app = createApp({ fetchImpl: fetchImpl as unknown as typeof fetch });
    const res = await app.request(chatRequest(hello), undefined, env());
    expect(res.status).toBe(503);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(await res.text()).toContain('"type":"error"');
  }, 10_000);

  it('does not retry client-side rejections from the model', async () => {
    const fetchImpl = vi.fn(async () => new Response('bad', { status: 400 }));
    const app = createApp({ fetchImpl: fetchImpl as unknown as typeof fetch });
    const res = await app.request(chatRequest(hello), undefined, env());
    expect(res.status).toBe(503);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('answers CORS preflight for allowed origins only', async () => {
    const app = createApp();
    const preflight = (origin: string) =>
      app.request(
        new Request('https://worker.test/v1/chat', {
          method: 'OPTIONS',
          headers: { origin, 'access-control-request-method': 'POST' },
        }),
        undefined,
        env()
      );
    expect((await preflight(ORIGIN)).headers.get('access-control-allow-origin')).toBe(ORIGIN);
    expect((await preflight('https://evil.example')).headers.get('access-control-allow-origin')).toBeNull();
  });
});
