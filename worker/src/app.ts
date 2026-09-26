import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { assessConversationRisk } from '../../src/lib/companion/safety';
import type { StreamEvent } from '../../src/lib/companion/types';
import { openCompletion, translateStream, UpstreamError } from './anthropic';
import { ConfigError, loadConfig, parseOrigins, type Env } from './env';
import { Logger, requestIdFrom } from './logger';
import { buildSystemPrompt } from './prompt';
import { chatRequestSchema, normalizeHistory, userTexts } from './schema';

export type AppDeps = {
  fetchImpl?: typeof fetch;
  now?: () => number;
};

type Variables = { log: Logger; requestId: string };

const MAX_BODY_BYTES = 64 * 1024;
const UPSTREAM_TIMEOUT_MS = 45_000;

export function createApp(deps: AppDeps = {}) {
  const app = new Hono<{ Bindings: Env; Variables: Variables }>();

  app.use('*', async (c, next) => {
    const requestId = requestIdFrom(c.req.raw);
    c.set('requestId', requestId);
    c.set('log', new Logger(requestId));
    c.header('x-request-id', requestId);
    await next();
  });

  app.use(
    '*',
    secureHeaders({
      contentSecurityPolicy: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] },
      strictTransportSecurity: 'max-age=63072000; includeSubDomains',
      referrerPolicy: 'no-referrer',
    })
  );

  app.use('*', async (c, next) => {
    const allowed = parseOrigins(c.env.ALLOWED_ORIGINS);
    return cors({
      origin: (origin) => (allowed.includes(origin) ? origin : null),
      allowMethods: ['POST', 'GET', 'OPTIONS'],
      allowHeaders: ['content-type', 'accept'],
      exposeHeaders: ['x-request-id'],
      maxAge: 600,
    })(c, next);
  });

  app.get('/health', (c) => {
    let configured = true;
    try {
      loadConfig(c.env);
    } catch {
      configured = false;
    }
    return c.json(
      { status: configured ? 'ok' : 'degraded', service: 'stay-companion', configured },
      configured ? 200 : 503
    );
  });

  app.post('/v1/chat', bodyLimit({ maxSize: MAX_BODY_BYTES }), async (c) => {
    const log = c.get('log');
    const started = (deps.now ?? Date.now)();

    let config;
    try {
      config = loadConfig(c.env);
    } catch (error) {
      log.error('config_invalid', { message: error instanceof ConfigError ? error.message : 'unknown' });
      return c.json({ error: 'service_unavailable', message: 'Companion is not configured.' }, 503);
    }

    const origin = c.req.header('origin');
    if (origin && !config.allowedOrigins.includes(origin)) {
      log.warn('origin_rejected');
      return c.json({ error: 'forbidden', message: 'Origin not allowed.' }, 403);
    }

    const limiter = c.env.CHAT_RATE_LIMITER;
    if (limiter) {
      const key = c.req.header('cf-connecting-ip') ?? 'anonymous';
      const { success } = await limiter.limit({ key });
      if (!success) {
        log.warn('rate_limited');
        return c.json(
          { error: 'rate_limited', message: 'Too many messages in a short time. Ember is still here; take a breath.' },
          429
        );
      }
    }

    const parsed = chatRequestSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) {
      log.warn('request_invalid', { issues: parsed.error.issues.length });
      return c.json({ error: 'bad_request', message: 'Malformed conversation.' }, 400);
    }

    const history = normalizeHistory(parsed.data.messages);
    if (history.length === 0) {
      return c.json({ error: 'bad_request', message: 'Conversation must end with a user message.' }, 400);
    }

    const risk = assessConversationRisk(userTexts(history));
    log.info('chat_started', { turns: history.length, risk, model: config.model });

    const timeout = AbortSignal.timeout(UPSTREAM_TIMEOUT_MS);
    const signal = AbortSignal.any([timeout, c.req.raw.signal]);

    let upstream: Response;
    try {
      upstream = await openCompletion({
        config,
        system: buildSystemPrompt(risk),
        messages: history,
        signal,
        fetchImpl: deps.fetchImpl,
      });
    } catch (error) {
      const code = error instanceof UpstreamError ? error.code : 'upstream_unavailable';
      const status = error instanceof UpstreamError ? error.status : 0;
      log.error('upstream_failed', { code, status, durationMs: (deps.now ?? Date.now)() - started });
      const event: StreamEvent = {
        type: 'error',
        code,
        message: 'Ember could not reach the model right now.',
      };
      return new Response(`data: ${JSON.stringify(event)}\n\n`, {
        status: code === 'upstream_rate_limited' ? 429 : 503,
        headers: sseHeaders(),
      });
    }

    log.info('chat_streaming', { risk, durationMs: (deps.now ?? Date.now)() - started });
    return new Response(translateStream(upstream.body!), { status: 200, headers: sseHeaders() });
  });

  app.notFound((c) => c.json({ error: 'not_found' }, 404));

  app.onError((error, c) => {
    c.get('log')?.error('unhandled', { message: error.message });
    return c.json({ error: 'internal', message: 'Something went wrong.' }, 500);
  });

  return app;
}

function sseHeaders(): HeadersInit {
  return {
    'content-type': 'text/event-stream; charset=utf-8',
    'cache-control': 'no-cache, no-store',
    connection: 'keep-alive',
    'x-accel-buffering': 'no',
  };
}
