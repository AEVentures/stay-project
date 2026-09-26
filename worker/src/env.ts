export type Env = {
  ANTHROPIC_API_KEY: string;
  ANTHROPIC_MODEL?: string;
  ALLOWED_ORIGINS?: string;
  MAX_OUTPUT_TOKENS?: string;
  CHAT_RATE_LIMITER?: RateLimit;
  CALL_RATE_LIMITER?: RateLimit;
  /** Public https base URL of this worker, needed for Twilio callbacks. */
  PUBLIC_BASE_URL?: string;
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_FROM_NUMBER?: string;
  TWILIO_VOICE?: string;
};

export type Config = {
  apiKey: string;
  model: string;
  allowedOrigins: readonly string[];
  maxOutputTokens: number;
};

export type PhoneConfig = {
  accountSid: string;
  authToken: string;
  fromNumber: string;
  baseUrl: string;
  voice: string | null;
};

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

export const DEFAULT_MODEL = 'claude-sonnet-4-5';
export const DEFAULT_MAX_OUTPUT_TOKENS = 600;

export function loadConfig(env: Env): Config {
  if (!env.ANTHROPIC_API_KEY) {
    throw new ConfigError('ANTHROPIC_API_KEY secret is not set.');
  }
  const maxOutputTokens = Number.parseInt(env.MAX_OUTPUT_TOKENS ?? '', 10);
  return {
    apiKey: env.ANTHROPIC_API_KEY,
    model: env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL,
    allowedOrigins: parseOrigins(env.ALLOWED_ORIGINS),
    maxOutputTokens:
      Number.isFinite(maxOutputTokens) && maxOutputTokens > 0
        ? Math.min(maxOutputTokens, 2000)
        : DEFAULT_MAX_OUTPUT_TOKENS,
  };
}

/** Phone mode is optional; returns null until every Twilio setting is present. */
export function loadPhoneConfig(env: Env): PhoneConfig | null {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER, PUBLIC_BASE_URL } = env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER || !PUBLIC_BASE_URL) return null;
  return {
    accountSid: TWILIO_ACCOUNT_SID,
    authToken: TWILIO_AUTH_TOKEN,
    fromNumber: TWILIO_FROM_NUMBER,
    baseUrl: PUBLIC_BASE_URL.replace(/\/$/, ''),
    voice: env.TWILIO_VOICE?.trim() || null,
  };
}

export function parseOrigins(raw: string | undefined): readonly string[] {
  return (raw ?? '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);
}
