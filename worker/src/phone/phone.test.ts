import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../app';
import type { Env } from '../env';
import { Logger } from '../logger';
import { fallbackLine, RelaySession, type RelayOutbound } from './relay';
import { escapeXml, relayTwiml } from './twiml';
import { mintCallToken, twilioSignature, verifyCallToken, verifyTwilioRequest } from './twilio';

const ORIGIN = 'https://aeventures.github.io';
const BASE = 'https://companion.test';

function env(overrides: Partial<Env> = {}): Env {
  return {
    ANTHROPIC_API_KEY: 'test-key',
    ALLOWED_ORIGINS: ORIGIN,
    PUBLIC_BASE_URL: BASE,
    TWILIO_ACCOUNT_SID: 'ACxxx',
    TWILIO_AUTH_TOKEN: 'twilio-secret',
    TWILIO_FROM_NUMBER: '+15555550100',
    ...overrides,
  };
}

function anthropicStream(frames: string[]): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      frames.forEach((f) => controller.enqueue(encoder.encode(f)));
      controller.close();
    },
  });
  return new Response(body, { status: 200 });
}

describe('twilio signatures and tokens', () => {
  it('produces the documented HMAC-SHA1 signature shape and verifies it', async () => {
    const url = `${BASE}/v1/phone/voice?token=abc`;
    const params = { CallSid: 'CA1', From: '+15550001111' };
    const sig = await twilioSignature('twilio-secret', url, params);
    expect(sig).toMatch(/^[A-Za-z0-9+/]+=*$/);
    expect(await verifyTwilioRequest('twilio-secret', url, params, sig)).toBe(true);
    expect(await verifyTwilioRequest('twilio-secret', url, { ...params, From: '+15550009999' }, sig)).toBe(false);
    expect(await verifyTwilioRequest('other', url, params, sig)).toBe(false);
    expect(await verifyTwilioRequest('twilio-secret', url, params, null)).toBe(false);
  });

  it('mints call tokens that expire and cannot be forged', async () => {
    const now = 1_000_000;
    const token = await mintCallToken('twilio-secret', now + 60_000);
    expect(await verifyCallToken('twilio-secret', token, now)).toBe(true);
    expect(await verifyCallToken('twilio-secret', token, now + 61_000)).toBe(false);
    expect(await verifyCallToken('twilio-secret', `${token}x`, now)).toBe(false);
    expect(await verifyCallToken('twilio-secret', null, now)).toBe(false);
  });
});

describe('twiml', () => {
  it('connects ConversationRelay over wss with the token and escapes attributes', () => {
    const xml = relayTwiml(
      { accountSid: 'AC', authToken: 't', fromNumber: '+1', baseUrl: BASE, voice: 'en-US "Journey"' },
      'tok.en'
    );
    expect(xml).toContain('<ConversationRelay url="wss://companion.test/v1/phone/relay?token=tok.en"');
    expect(xml).toContain('voice="en-US &quot;Journey&quot;"');
    expect(xml).toContain('interruptible="any"');
    expect(xml).toContain("I&apos;m an A.I. character, not a person");
    expect(escapeXml('<a & b>')).toBe('&lt;a &amp; b&gt;');
  });
});

describe('RelaySession', () => {
  const config = { apiKey: 'k', model: 'm', allowedOrigins: [], maxOutputTokens: 600 };
  const silentLog = new Logger('test', { log: () => undefined });

  it('streams model tokens to Twilio and marks the end of the turn', async () => {
    const sent: RelayOutbound[] = [];
    const fetchImpl = vi.fn(async (_url: unknown, init?: RequestInit) => {
      const body = JSON.parse(init?.body as string) as { system: string; messages: { role: string }[]; max_tokens: number };
      expect(body.system).toContain('THIS IS A PHONE CALL');
      expect(body.messages[0].role).toBe('user');
      expect(body.max_tokens).toBeLessThanOrEqual(220);
      return anthropicStream([
        'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"I hear "}}\n\n',
        'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"you."}}\n\n',
        'data: {"type":"message_stop"}\n\n',
      ]);
    });
    const session = new RelaySession({ config, log: silentLog, send: (m) => sent.push(m), fetchImpl: fetchImpl as unknown as typeof fetch });
    await session.handle({ type: 'setup', callSid: 'CA1' });
    await session.handle({ type: 'prompt', voicePrompt: 'i feel like a burden', last: true });
    expect(sent).toEqual([
      { type: 'text', token: 'I hear ', last: false },
      { type: 'text', token: 'you.', last: false },
      { type: 'text', token: '', last: true },
    ]);
    expect(session.currentRisk).toBe('elevated');
  });

  it('ignores partial prompts and speaks a safe fallback when the model fails', async () => {
    const sent: RelayOutbound[] = [];
    const fetchImpl = vi.fn(async () => new Response('down', { status: 500 }));
    const session = new RelaySession({ config, log: silentLog, send: (m) => sent.push(m), fetchImpl: fetchImpl as unknown as typeof fetch });
    await session.handle({ type: 'prompt', voicePrompt: 'partial', last: false });
    expect(sent).toEqual([]);
    await session.handle({ type: 'prompt', voicePrompt: "I'm going to kill myself tonight", last: true });
    expect(sent[0]).toEqual({ type: 'text', token: fallbackLine('imminent'), last: false });
    expect(sent[1]).toEqual({ type: 'text', token: '', last: true });
    expect(fallbackLine('imminent')).toContain('nine eight eight');
  }, 10_000);
});

describe('phone routes', () => {
  it('reports phone availability in /health and 503s when unconfigured', async () => {
    const app = createApp();
    const on = await app.request('/health', {}, env());
    expect(await on.json()).toMatchObject({ phone: true });
    const off = await app.request('/health', {}, env({ TWILIO_AUTH_TOKEN: '' }));
    expect(await off.json()).toMatchObject({ phone: false });
    const call = await app.request('/v1/phone/call', { method: 'POST' }, env({ TWILIO_AUTH_TOKEN: '' }));
    expect(call.status).toBe(503);
  });

  it('places a call through Twilio for a consenting, allowed-origin request', async () => {
    const fetchImpl = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      expect(String(url)).toBe('https://api.twilio.com/2010-04-01/Accounts/ACxxx/Calls.json');
      const params = new URLSearchParams(init?.body as string);
      expect(params.get('To')).toBe('+15550001111');
      expect(params.get('Url')).toMatch(new RegExp(`^${BASE}/v1/phone/voice\\?token=`));
      return new Response(JSON.stringify({ sid: 'CA123' }), { status: 201 });
    });
    const app = createApp({ fetchImpl: fetchImpl as unknown as typeof fetch });
    const res = await app.request(
      new Request(`${BASE}/v1/phone/call`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: ORIGIN },
        body: JSON.stringify({ phone: '+15550001111', consent: true }),
      }),
      undefined,
      env()
    );
    expect(res.status).toBe(202);
  });

  it('rejects calls without origin, without consent, or with bad numbers', async () => {
    const app = createApp({ fetchImpl: vi.fn() as unknown as typeof fetch });
    const post = (body: unknown, origin?: string) =>
      app.request(
        new Request(`${BASE}/v1/phone/call`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', ...(origin ? { origin } : {}) },
          body: JSON.stringify(body),
        }),
        undefined,
        env()
      );
    expect((await post({ phone: '+15550001111', consent: true })).status).toBe(403);
    expect((await post({ phone: '+15550001111', consent: false }, ORIGIN)).status).toBe(400);
    expect((await post({ phone: '555-0111', consent: true }, ORIGIN)).status).toBe(400);
  });

  it('serves relay TwiML only to correctly signed Twilio requests', async () => {
    const app = createApp();
    const token = await mintCallToken('twilio-secret', Date.now() + 60_000);
    const url = `${BASE}/v1/phone/voice?token=${encodeURIComponent(token)}`;
    const params = { CallSid: 'CA1', AnsweredBy: 'human' };
    const signature = await twilioSignature('twilio-secret', url, params);
    const post = (sig: string) =>
      app.request(
        new Request(url, {
          method: 'POST',
          headers: { 'content-type': 'application/x-www-form-urlencoded', 'x-twilio-signature': sig },
          body: new URLSearchParams(params),
        }),
        undefined,
        env()
      );
    const ok = await post(signature);
    expect(ok.status).toBe(200);
    expect(await ok.text()).toContain('<ConversationRelay');
    expect((await post('bad')).status).toBe(403);
  });

  it('refuses relay upgrades without a valid token', async () => {
    const app = createApp();
    const res = await app.request(
      new Request(`${BASE}/v1/phone/relay?token=nope`, { headers: { upgrade: 'websocket' } }),
      undefined,
      env()
    );
    expect(res.status).toBe(403);
  });
});
