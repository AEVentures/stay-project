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

## How it is built

```
src/components/companion/   Ember avatar (SVG), chat panel, crisis strip
src/hooks/use-companion-chat.ts   Streaming state, risk tracking, offline fallback
src/lib/companion/          Shared: types, risk classifier, grounding scripts, SSE client
worker/                     Cloudflare Worker (Hono) that talks to the model
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

## Changing Ember's voice

Edit `worker/src/prompt.ts`. Every change to the persona must keep the
"SAFETY CONTRACT" section intact and pass `pnpm worker:test`, which asserts
the non-human disclosure, the means/method prohibition, 988, and the
safe-messaging language rules. Copy changes in the UI go through the
[Safe Messaging](./SAFE_MESSAGING.md) checklist like everything else.
