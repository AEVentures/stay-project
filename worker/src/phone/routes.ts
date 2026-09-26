import { Hono } from 'hono';
import { z } from 'zod';
import { loadConfig, loadPhoneConfig, type Env } from '../env';
import type { Logger } from '../logger';
import { RelaySession, type RelayInbound } from './relay';
import { hangupTwiml, relayTwiml } from './twiml';
import { mintCallToken, placeCall, TwilioError, verifyCallToken, verifyTwilioRequest } from './twilio';

type Variables = { log: Logger; requestId: string };

export type PhoneDeps = { fetchImpl?: typeof fetch; now?: () => number };

const CALL_TOKEN_TTL_MS = 10 * 60 * 1000;

export const callRequestSchema = z.object({
  phone: z.string().regex(/^\+[1-9]\d{6,14}$/, 'E.164 phone number required'),
  consent: z.literal(true),
});

/**
 * Phone mode. Everything here 503s cleanly until Twilio settings exist, so
 * the site can probe /health and hide the Call tab.
 */
export function phoneRoutes(deps: PhoneDeps = {}) {
  const app = new Hono<{ Bindings: Env; Variables: Variables }>();
  const now = deps.now ?? Date.now;

  app.use('*', async (c, next) => {
    if (!loadPhoneConfig(c.env)) return c.json({ error: 'phone_unavailable', message: 'Phone mode is not configured.' }, 503);
    await next();
  });

  // Site -> worker: "call me". Origin-checked by the parent app's CORS.
  app.post('/call', async (c) => {
    const log = c.get('log');
    const phone = loadPhoneConfig(c.env)!;
    let allowedOrigins: readonly string[];
    try {
      allowedOrigins = loadConfig(c.env).allowedOrigins;
    } catch {
      return c.json({ error: 'service_unavailable', message: 'Companion is not configured.' }, 503);
    }
    // Browser-only endpoint: an Origin we recognise is mandatory, not optional.
    const origin = c.req.header('origin');
    if (!origin || !allowedOrigins.includes(origin)) {
      log.warn('call_origin_rejected');
      return c.json({ error: 'forbidden', message: 'Origin not allowed.' }, 403);
    }

    const limiter = c.env.CALL_RATE_LIMITER;
    if (limiter) {
      const { success } = await limiter.limit({ key: `call:${c.req.header('cf-connecting-ip') ?? 'anonymous'}` });
      if (!success) {
        log.warn('call_rate_limited');
        return c.json({ error: 'rate_limited', message: 'Too many call requests.' }, 429);
      }
    }

    const parsed = callRequestSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: 'bad_request', message: 'A valid phone number and consent are required.' }, 400);

    const token = await mintCallToken(phone.authToken, now() + CALL_TOKEN_TTL_MS);
    try {
      const sid = await placeCall({ config: phone, to: parsed.data.phone, token, fetchImpl: deps.fetchImpl });
      log.info('call_placed', { sid });
      return c.json({ status: 'queued' }, 202);
    } catch (error) {
      const status = error instanceof TwilioError ? error.status : 502;
      log.error('call_failed', { status });
      return c.json({ error: 'call_failed', message: 'Ember could not place the call.' }, 502);
    }
  });

  // Twilio -> worker: what should this call do? Answer: connect ConversationRelay.
  app.post('/voice', async (c) => {
    const phone = loadPhoneConfig(c.env)!;
    const form = await c.req.parseBody();
    const params = Object.fromEntries(Object.entries(form).filter((e): e is [string, string] => typeof e[1] === 'string'));
    const url = `${phone.baseUrl}${new URL(c.req.url).pathname}${new URL(c.req.url).search}`;
    if (!(await verifyTwilioRequest(phone.authToken, url, params, c.req.header('x-twilio-signature') ?? null))) {
      c.get('log').warn('twilio_signature_rejected');
      return c.text('forbidden', 403);
    }
    if (params.AnsweredBy && /machine|fax/i.test(params.AnsweredBy)) {
      return c.body(hangupTwiml(), 200, { 'content-type': 'text/xml' });
    }
    // Outbound calls carry the token we minted; inbound calls (someone dialing Ember) get a fresh one.
    const token = c.req.query('token') ?? (await mintCallToken(phone.authToken, now() + CALL_TOKEN_TTL_MS));
    if (c.req.query('token') && !(await verifyCallToken(phone.authToken, token, now()))) return c.text('forbidden', 403);
    return c.body(relayTwiml(phone, token), 200, { 'content-type': 'text/xml' });
  });

  // Twilio -> worker: the live conversation over WebSocket.
  app.get('/relay', async (c) => {
    const phone = loadPhoneConfig(c.env)!;
    const log = c.get('log');
    if (c.req.header('upgrade')?.toLowerCase() !== 'websocket') return c.text('expected websocket', 426);
    if (!(await verifyCallToken(phone.authToken, c.req.query('token') ?? null, now()))) return c.text('forbidden', 403);

    let config;
    try {
      config = loadConfig(c.env);
    } catch {
      return c.text('companion not configured', 503);
    }

    const pair = new WebSocketPair();
    const [client, server] = [pair[0], pair[1]];
    const session = new RelaySession({ config, log, fetchImpl: deps.fetchImpl, send: (m) => server.send(JSON.stringify(m)) });

    server.accept();
    server.addEventListener('message', (event) => {
      let message: RelayInbound | null = null;
      try {
        message = JSON.parse(typeof event.data === 'string' ? event.data : '') as RelayInbound;
      } catch {
        return;
      }
      if (message) void session.handle(message);
    });
    server.addEventListener('close', () => session.close());
    server.addEventListener('error', () => session.close());

    return new Response(null, { status: 101, webSocket: client });
  });

  // Twilio -> worker: relay finished; hang up gracefully.
  app.post('/ended', (c) => c.body(hangupTwiml(), 200, { 'content-type': 'text/xml' }));

  return app;
}
