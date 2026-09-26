# Ember — the companion character

Ember is The Stay Project's companion: a small, steady flame resting in a
lantern. Ember is deliberately **not a person**. The character exists so
that someone at 2 a.m. has a calm, nonjudgmental presence that helps them
slow the moment down, find words, and reach a human being who can help.

> Ember is an AI character. It is not a crisis service, a therapist, or a
> clinician. If you or someone you know may act on thoughts of suicide,
> call or text **988** (US) or your local emergency number.

## Why a flame, not a face

- **The name is the mission.** A light that stays on through the night says
  "you are still here" without saying a word.
- **Non-human on purpose.** A character that cannot be mistaken for a real
  person cannot be impersonated, cannot be grieved as a person, and never
  sets up a false relationship. Research on companion characters (Woebot's
  robot, Wysa's penguin) suggests non-human characters lower shame and
  raise disclosure.
- **Warm, not childish.** Soft eyes and a faint smile give presence; the
  lantern grounds it for adults.

## Three ways in: text, voice, phone

One conversation, three surfaces. Switching never loses the thread.

| Mode | How it works | Needs |
| --- | --- | --- |
| **Text** | Streaming chat in the page. | Worker (or offline mode). |
| **Voice** | Browser speech recognition hears you; the browser's speech synthesis speaks Ember's words as sentences arrive; the flame animates to both your voice (mic amplitude) and hers (word boundaries). Hands-free loop with an Interrupt button. Captions always shown. | Chrome, Edge, or Safari. No extra services or keys. |
| **Call** | Boardy-style: Ember calls your phone. Twilio ConversationRelay does speech in both directions and exchanges text with the worker over a WebSocket. | Twilio account, number, and `PUBLIC_BASE_URL`. The Call tab only appears when `/health` reports `phone: true`. |

Voice mode uses the browser's built-in engines on purpose: zero new
infrastructure, and it can be upgraded to a speech-to-speech model later
by replacing `src/lib/voice/` behind the same `useVoiceSession` hook.

## Presence: what makes Ember someone, not something

- **Ember remembers you (opt-in).** Your name, the people you mention,
  what you're carrying, what has helped, and threads to follow up on.
  Stored only in your browser, AES-256-GCM encrypted with a non-extractable
  key in IndexedDB. Off by default; "Forget everything" wipes key and data.
  The worker never stores it; a compact summary rides along with each
  request so Ember can pick up the thread, and `/v1/reflect` distills a
  conversation into a validated delta the browser saves.
- **A stay plan, together.** After Stanley & Brown's Safety Planning
  Intervention: warning signs, coping steps, distractions, supporters,
  professionals, safer space, reasons. Ember proposes lines from what you
  said; you own every word. Printable. Lives with memory.
- **Time-aware.** Ember knows it is 3 a.m. for you and lets that change
  her pace. Greetings and the model both get the local hour.
- **Notices silence.** In text mode, if you go quiet after she replies, she
  says something small (at most twice), never a nudge to keep typing.
- **A human pace.** A beat before answering, longer for heavier messages,
  instant when risk is imminent.
- **Talks like a person.** The system prompt now describes how a steady
  friend actually talks: your words back to you, one thread at a time,
  permission before advice, no crisis line recited every turn, endings that
  let you go warmly.
- **Alive.** Eyes blink and drift; the flame breathes and reacts to voice.
  Spoken replies are chunked at clauses with small pauses.

## How it is built

```
src/components/companion/   Ember avatar (SVG), chat shell + mode tabs, text conversation,
                            voice stage (audiovisual), call-me form, crisis strip
src/hooks/                  use-companion-chat (streaming, risk, offline fallback),
                            use-voice-session (listen -> think -> speak loop),
                            use-companion-health (probe worker capabilities)
src/lib/companion/          Shared: types, risk classifier, grounding scripts, SSE client
src/lib/voice/              Browser speech: Listener, Speaker, sentence/clause chunker, mic level
src/lib/memory/             Encrypted on-device memory, stay plan, presence (greetings, pacing)
worker/                     Cloudflare Worker (Hono): /v1/chat, /v1/reflect, /health, /v1/phone/*
```

### Safety architecture

1. **Risk classifier** (`src/lib/companion/safety.ts`) runs in the browser
   *and* in the worker on recent user messages. It never blocks the
   conversation; it raises the 988 card in the UI (`elevated` /
   `imminent`) and injects matching guidance into the model's system prompt.
2. **System prompt** (`worker/src/prompt.ts`) follows WHO / AFSP safe
   messaging: never discuss means or methods, never guilt or argue, always
   bridge to 988 and a trusted person when risk rises, always disclose that
   Ember is an AI character.
3. **Offline fallback** (`src/lib/companion/grounding.ts`): if the worker
   is unreachable, Ember still answers with a clearly labeled scripted
   reply, a grounding exercise, and 988. No fake "AI" text.
4. **Privacy**: messages are held in memory only, sent to the worker over
   HTTPS, forwarded to the model, and never stored by The Stay Project.
   The worker logs request ids, risk level, and timings — never content.

### Worker

```bash
cp worker/.dev.vars.example worker/.dev.vars   # add ANTHROPIC_API_KEY
pnpm worker:dev                                # http://localhost:8787
pnpm worker:test
pnpm worker:typecheck
```

Deploy (requires a Cloudflare account and `wrangler login`):

```bash
cd worker
pnpm exec wrangler secret put ANTHROPIC_API_KEY
pnpm exec wrangler deploy
```

Then point the site at it by setting `VITE_COMPANION_API_URL` (see
`.env.example`) — in GitHub Actions, add it as a repository variable and
pass it to the build step in `.github/workflows/deploy.yml`. Until it is
set, the site runs Ember in offline mode.

Configuration (`worker/wrangler.jsonc`):

| Name | Purpose |
| --- | --- |
| `ANTHROPIC_API_KEY` | Secret. Model API key. |
| `ANTHROPIC_MODEL` | Model id. Default `claude-sonnet-4-5`. |
| `ALLOWED_ORIGINS` | Comma-separated origins allowed to call the worker. |
| `MAX_OUTPUT_TOKENS` | Cap on reply length (default 600, max 2000). |
| `CHAT_RATE_LIMITER` | Rate limit binding, 30 requests / 60 s per IP. |
| `CALL_RATE_LIMITER` | Rate limit binding for "call me", 3 / 60 s per IP. |
| `PUBLIC_BASE_URL` | Phone mode. This worker's public https URL (for Twilio callbacks). |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` | Secrets. Phone mode. |
| `TWILIO_FROM_NUMBER` | Phone mode. E.164 number Ember calls from. |
| `TWILIO_VOICE` | Optional ConversationRelay voice id. |

### Phone mode endpoints

- `POST /v1/phone/call` — site asks Ember to call `{ phone, consent: true }`. Origin-locked, rate limited, returns 202.
- `POST /v1/phone/voice` — Twilio webhook (signature-verified) returning `<Connect><ConversationRelay>` TwiML. Answering machines get a hangup.
- `GET /v1/phone/relay` — WebSocket for the live call; token-gated. Handles `setup`, `prompt`, `interrupt`.
- `POST /v1/phone/ended` — hangup TwiML when the relay finishes.

To receive inbound calls too, point the Twilio number's voice webhook at
`POST /v1/phone/voice`.

## Changing Ember's voice

Edit `worker/src/prompt.ts`. Every change to the persona must keep the
"SAFETY CONTRACT" section intact and pass `pnpm worker:test`, which asserts
the non-human disclosure, the means/method prohibition, 988, and the
safe-messaging language rules. Copy changes in the UI go through the
[Safe Messaging](./SAFE_MESSAGING.md) checklist like everything else.
