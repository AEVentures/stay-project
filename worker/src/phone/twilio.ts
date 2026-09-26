import type { PhoneConfig } from '../env';

/**
 * Twilio signs webhooks with HMAC-SHA1 over the full request URL plus the
 * POST parameters sorted by name and concatenated as name+value.
 */
export async function twilioSignature(authToken: string, url: string, params: Record<string, string>): Promise<string> {
  const data = Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], url);
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(authToken),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(mac)));
}

export async function verifyTwilioRequest(
  authToken: string,
  url: string,
  params: Record<string, string>,
  signature: string | null
): Promise<boolean> {
  if (!signature) return false;
  const expected = await twilioSignature(authToken, url, params);
  return timingSafeEqual(expected, signature);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export type PlaceCallInput = {
  config: PhoneConfig;
  to: string;
  token: string;
  fetchImpl?: typeof fetch;
};

export class TwilioError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = 'TwilioError';
  }
}

/** Places an outbound call that Twilio will answer by fetching our TwiML. */
export async function placeCall({ config, to, token, fetchImpl = fetch }: PlaceCallInput): Promise<string> {
  const voiceUrl = `${config.baseUrl}/v1/phone/voice?token=${encodeURIComponent(token)}`;
  const body = new URLSearchParams({
    To: to,
    From: config.fromNumber,
    Url: voiceUrl,
    Method: 'POST',
    MachineDetection: 'Enable',
    Timeout: '30',
  });
  const response = await fetchImpl(
    `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(config.accountSid)}/Calls.json`,
    {
      method: 'POST',
      headers: {
        authorization: `Basic ${btoa(`${config.accountSid}:${config.authToken}`)}`,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body,
    }
  );
  if (!response.ok) throw new TwilioError(response.status, `Twilio rejected the call (${response.status}).`);
  const json = (await response.json()) as { sid?: string };
  if (!json.sid) throw new TwilioError(502, 'Twilio returned no call sid.');
  return json.sid;
}

/**
 * Short-lived HMAC token binding a call to this worker so only calls we
 * initiated (or inbound calls Twilio signs) can open a relay session.
 */
export async function mintCallToken(authToken: string, expiresAt: number): Promise<string> {
  const payload = String(expiresAt);
  const sig = await twilioSignature(authToken, 'call-token', { exp: payload });
  return `${payload}.${sig.replace(/[+/=]/g, (c) => ({ '+': '-', '/': '_', '=': '' })[c] ?? c)}`;
}

export async function verifyCallToken(authToken: string, token: string | null, now = Date.now()): Promise<boolean> {
  if (!token) return false;
  const [exp, sig] = token.split('.');
  const expiresAt = Number(exp);
  if (!Number.isFinite(expiresAt) || expiresAt < now || !sig) return false;
  const expected = await mintCallToken(authToken, expiresAt);
  return timingSafeEqual(expected, token);
}
