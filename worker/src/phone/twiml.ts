import type { PhoneConfig } from '../env';

export const PHONE_GREETING =
  "Hi, this is Ember, from The Stay Project. I'm an A.I. character, not a person, and I'm glad you picked up. There's no rush. What's the heaviest part of right now?";

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * TwiML that hands the call to ConversationRelay. Twilio does speech-to-text
 * and text-to-speech; we exchange text with it over the relay WebSocket.
 */
export function relayTwiml(config: PhoneConfig, token: string): string {
  const wsBase = config.baseUrl.replace(/^http/, 'ws');
  const relayUrl = `${wsBase}/v1/phone/relay?token=${encodeURIComponent(token)}`;
  const actionUrl = `${config.baseUrl}/v1/phone/ended`;
  const voiceAttr = config.voice ? ` voice="${escapeXml(config.voice)}"` : '';
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect action="${escapeXml(actionUrl)}">
    <ConversationRelay url="${escapeXml(relayUrl)}" welcomeGreeting="${escapeXml(PHONE_GREETING)}"${voiceAttr} interruptible="any" welcomeGreetingInterruptible="any" dtmfDetection="false" />
  </Connect>
</Response>`;
}

export function hangupTwiml(message?: string): string {
  const say = message ? `<Say>${escapeXml(message)}</Say>` : '';
  return `<?xml version="1.0" encoding="UTF-8"?><Response>${say}<Hangup/></Response>`;
}
