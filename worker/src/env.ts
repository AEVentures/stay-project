export type Env = {
  ANTHROPIC_API_KEY: string;
  ANTHROPIC_MODEL?: string;
  ALLOWED_ORIGINS?: string;
  MAX_OUTPUT_TOKENS?: string;
  CHAT_RATE_LIMITER?: RateLimit;
};

export type Config = {
  apiKey: string;
  model: string;
  allowedOrigins: readonly string[];
  maxOutputTokens: number;
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

export function parseOrigins(raw: string | undefined): readonly string[] {
  return (raw ?? '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);
}
