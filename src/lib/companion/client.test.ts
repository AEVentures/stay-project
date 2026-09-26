import { describe, expect, it, vi } from 'vitest';
import { parseFrame, streamCompanionReply } from './client';
import { CompanionError } from './types';

function sseResponse(frames: string[], init: ResponseInit = {}): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const frame of frames) controller.enqueue(encoder.encode(frame));
      controller.close();
    },
  });
  return new Response(body, { status: 200, headers: { 'content-type': 'text/event-stream' }, ...init });
}

const messages = [{ role: 'user' as const, content: 'hi' }];

describe('parseFrame', () => {
  it('parses token frames', () => {
    expect(parseFrame('data: {"type":"token","text":"he"}')).toEqual({ type: 'token', text: 'he' });
  });

  it('ignores comments, malformed JSON and unknown shapes', () => {
    expect(parseFrame(': keepalive')).toBeNull();
    expect(parseFrame('data: {nope')).toBeNull();
    expect(parseFrame('data: {"type":"mystery"}')).toBeNull();
    expect(parseFrame('data: {"type":"token"}')).toBeNull();
  });
});

describe('streamCompanionReply', () => {
  it('rejects when no API URL is configured', async () => {
    await expect(
      streamCompanionReply({ apiUrl: '', messages, onToken: () => undefined })
    ).rejects.toMatchObject({ code: 'not_configured' });
  });

  it('streams tokens and returns the full text, handling split frames', async () => {
    const fetchImpl = vi.fn(async () =>
      sseResponse([
        'data: {"type":"token","text":"Hel"}\n\ndata: {"type":"tok',
        'en","text":"lo"}\n\ndata: {"type":"done"}\n\n',
      ])
    );
    const tokens: string[] = [];
    const full = await streamCompanionReply({
      apiUrl: 'https://api.example.test/',
      messages,
      onToken: (t) => tokens.push(t),
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(full).toBe('Hello');
    expect(tokens).toEqual(['Hel', 'lo']);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.example.test/v1/chat');
    expect(JSON.parse(init.body as string)).toEqual({ messages });
  });

  it('retries connection failures with backoff, then succeeds', async () => {
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockResolvedValueOnce(sseResponse(['data: {"type":"token","text":"ok"}\n\ndata: {"type":"done"}\n\n']));
    const full = await streamCompanionReply({
      apiUrl: 'https://api.example.test',
      messages,
      onToken: () => undefined,
      fetchImpl: fetchImpl as unknown as typeof fetch,
      baseDelayMs: 1,
    });
    expect(full).toBe('ok');
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it('gives up after maxRetries with a network error', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(
      streamCompanionReply({
        apiUrl: 'https://api.example.test',
        messages,
        onToken: () => undefined,
        fetchImpl: fetchImpl as unknown as typeof fetch,
        maxRetries: 1,
        baseDelayMs: 1,
      })
    ).rejects.toMatchObject({ code: 'network' });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('does not retry 429 or 400 responses', async () => {
    const limited = vi.fn().mockResolvedValue(new Response('', { status: 429 }));
    await expect(
      streamCompanionReply({
        apiUrl: 'https://api.example.test',
        messages,
        onToken: () => undefined,
        fetchImpl: limited as unknown as typeof fetch,
      })
    ).rejects.toMatchObject({ code: 'rate_limited' });
    expect(limited).toHaveBeenCalledTimes(1);

    const bad = vi.fn().mockResolvedValue(new Response('', { status: 400 }));
    await expect(
      streamCompanionReply({
        apiUrl: 'https://api.example.test',
        messages,
        onToken: () => undefined,
        fetchImpl: bad as unknown as typeof fetch,
      })
    ).rejects.toBeInstanceOf(CompanionError);
    expect(bad).toHaveBeenCalledTimes(1);
  });

  it('surfaces in-stream error events', async () => {
    const fetchImpl = vi.fn(async () =>
      sseResponse(['data: {"type":"error","code":"upstream","message":"model unavailable"}\n\n'])
    );
    await expect(
      streamCompanionReply({
        apiUrl: 'https://api.example.test',
        messages,
        onToken: () => undefined,
        fetchImpl: fetchImpl as unknown as typeof fetch,
      })
    ).rejects.toMatchObject({ code: 'server', message: 'model unavailable' });
  });
});
