import { type FormEvent, useState } from 'react';
import { PhoneCall, PhoneIncoming } from 'lucide-react';
import { EmberAvatar } from './ember-avatar';

export interface CallEmberProps {
  apiUrl: string;
}

type CallState = { kind: 'idle' } | { kind: 'sending' } | { kind: 'queued' } | { kind: 'error'; message: string };

const E164 = /^\+[1-9]\d{6,14}$/;

/** Boardy-style: Ember calls you. Only rendered when the worker reports phone support. */
export function CallEmber({ apiUrl }: CallEmberProps) {
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<CallState>({ kind: 'idle' });

  const normalized = normalizePhone(phone);
  const valid = E164.test(normalized) && consent;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid || state.kind === 'sending') return;
    setState({ kind: 'sending' });
    try {
      const res = await fetch(`${apiUrl}/v1/phone/call`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ phone: normalized, consent: true }),
      });
      if (res.status === 429) {
        setState({ kind: 'error', message: 'Too many call requests right now. Try again in a minute, or call 988.' });
        return;
      }
      if (!res.ok) {
        setState({ kind: 'error', message: 'Ember could not place the call. 988 is always available.' });
        return;
      }
      setState({ kind: 'queued' });
    } catch {
      setState({ kind: 'error', message: 'Could not reach the call service. 988 is always available.' });
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-ink-900 px-6 py-8 text-center text-white">
      <EmberAvatar size={120} label="Ember, a small flame in a lantern" />
      <h3 className="mt-4 font-display text-2xl font-semibold">Ember can call you</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-200">
        Sometimes typing is too much. Enter your number and Ember will call within a minute for a spoken
        conversation. Ember is an AI character; for emergencies, call 988 or your local emergency number.
      </p>

      {state.kind === 'queued' ? (
        <p role="status" className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-care-400/40 bg-care-900/30 px-5 py-3 text-sm text-care-100">
          <PhoneIncoming className="h-4 w-4" aria-hidden /> Calling {normalized} now. Pick up when it rings.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 w-full max-w-sm space-y-3 text-left">
          <label htmlFor="ember-phone" className="block text-xs font-semibold uppercase tracking-wide text-ink-300">
            Your phone number
          </label>
          <input
            id="ember-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+1 555 555 0100"
            className="min-h-11 w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-[15px] text-white placeholder:text-ink-400 focus:border-ember-400 focus:outline-none focus:ring-2 focus:ring-ember-300/50"
          />
          <label className="flex items-start gap-3 text-xs leading-relaxed text-ink-200">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              className="mt-0.5 h-5 w-5 rounded border-white/30 bg-white/10 accent-ember-500"
            />
            I agree to receive one automated call from Ember at this number now. The call is not recorded by
            The Stay Project.
          </label>
          {state.kind === 'error' && (
            <p role="alert" className="text-sm text-ember-200">
              {state.message}
            </p>
          )}
          <button
            type="submit"
            disabled={!valid || state.kind === 'sending'}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-ember-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-ember-500/30 transition-all hover:-translate-y-0.5 hover:bg-ember-600 disabled:translate-y-0 disabled:opacity-40 disabled:shadow-none"
          >
            <PhoneCall className="h-4 w-4" aria-hidden />
            {state.kind === 'sending' ? 'Placing call…' : 'Call me now'}
          </button>
        </form>
      )}
    </div>
  );
}

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return digits ? `+${digits}` : '';
}
