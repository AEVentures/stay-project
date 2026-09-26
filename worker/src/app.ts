import { Hono, type Context } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { assessConversationRisk } from '../../src/lib/companion/safety';
import type { StreamEvent } from '../../src/lib/companion/types';
import { completeText, openCompletion, translateStream, UpstreamError } from './anthropic';
import { ConfigError, loadConfig, loadPhoneConfig, parseOrigins, type Config, type Env } from './env';
import { Logger, requestIdFrom } from './logger';
import { phoneRoutes } from './phone/routes';
import { buildSystemPrompt, REFLECT_SYSTEM_PROMPT } from './prompt';
import { chatRequestSchema, memoryDeltaSchema, normalizeHistory, reflectRequestSchema, userTexts } from './schema';

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
      { status: configured ? 'ok' : 'degraded', service: 'stay-companion', configured, phone: loadPhoneConfig(c.env) !== null },
      configured ? 200 : 503
    );
  });

  /** Shared preconditions for model-backed routes: config, origin, per-IP rate limit. */
  async function guard(c: Context<{ Bindings: Env; Variables: Variables }>): Promise<Config | Response> {
    const log = c.get('log');
    let config: Config;
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
      const { success } = await limiter.limit({ key: c.req.header('cf-connecting-ip') ?? 'anonymous' });
      if (!success) {
        log.warn('rate_limited');
        return c.json(
          { error: 'rate_limited', message: 'Too many messages in a short time. Ember is still here; take a breath.' },
          429
        );
      }
    }
    return config;
  }

  app.post('/v1/chat', bodyLimit({ maxSize: MAX_BODY_BYTES }), async (c) => {
    const log = c.get('log');
    const started = (deps.now ?? Date.now)();
    const config = await guard(c);
    if (config instanceof Response) return config;

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
    const context = parsed.data.context ?? {};
    log.info('chat_started', { turns: history.length, risk, model: config.model, hasMemory: Boolean(context.memory) });

    const timeout = AbortSignal.timeout(UPSTREAM_TIMEOUT_MS);
    const signal = AbortSignal.any([timeout, c.req.raw.signal]);

    let upstream: Response;
    try {
      upstream = await openCompletion({
        config,
        system: buildSystemPrompt(risk, { memory: context.memory ?? null, localHour: context.localHour ?? null }),
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

  /**
   * Reflection: turn a conversation into a small, validated memory delta the
   * browser stores encrypted. The worker keeps nothing.
   */
  app.post('/v1/reflect', bodyLimit({ maxSize: MAX_BODY_BYTES }), async (c) => {
    const log = c.get('log');
    const config = await guard(c);
    if (config instanceof Response) return config;

    const parsed = reflectRequestSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: 'bad_request', message: 'Malformed conversation.' }, 400);

    const transcript = parsed.data.messages
      .map((m) => `${m.role === 'user' ? 'PERSON' : 'EMBER'}: ${m.content}`)
      .join('\n');

    let raw: string;
    try {
      raw = await completeText({
        config: { ...config, maxOutputTokens: 700 },
        system: REFLECT_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: `Conversation:\n\n${transcript}\n\nReturn the JSON object now.` }],
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
        fetchImpl: deps.fetchImpl,
      });
    } catch (error) {
      const code = error instanceof UpstreamError ? error.code : 'upstream_unavailable';
      log.error('reflect_failed', { code });
      return c.json({ error: code, message: 'Could not reflect right now.' }, 503);
    }

    const delta = memoryDeltaSchema.safeParse(extractJson(raw));
    if (!delta.success) {
      log.warn('reflect_invalid', { issues: delta.error.issues.length });
      return c.json({ delta: {} });
    }
    log.info('reflect_ok', { fields: Object.keys(delta.data).length });
    return c.json({ delta: delta.data });
  });

  app.route('/v1/phone', phoneRoutes({ fetchImpl: deps.fetchImpl, now: deps.now }));

  app.notFound((c) => c.json({ error: 'not_found' }, 404));

  app.onError((error, c) => {
    c.get('log')?.error('unhandled', { message: error.message });
    return c.json({ error: 'internal', message: 'Something went wrong.' }, 500);
  });

  return app;
}

/** Models sometimes wrap JSON in prose or fences; take the outermost object. */
export function extractJson(raw: string): unknown {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
}

function sseHeaders(): HeadersInit {
  return {
    'content-type': 'text/event-stream; charset=utf-8',
    'cache-control': 'no-cache, no-store',
    connection: 'keep-alive',
    'x-accel-buffering': 'no',
  };
}
