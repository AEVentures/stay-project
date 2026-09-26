import { type FormEvent, useState } from 'react';
import { Lock, MessageCircle, Phone } from 'lucide-react';
import { unlockSite } from '@/lib/password-gate';

type PasswordGateProps = {
  onUnlock: () => void;
  embedded?: boolean;
};

export function PasswordGate({ onUnlock, embedded = false }: PasswordGateProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!password || pending) return;

    setPending(true);
    setError('');

    try {
      const unlocked = await unlockSite(password);
      if (unlocked) {
        onUnlock();
      } else {
        setError('That password did not unlock this site.');
      }
    } catch {
      setError('This browser could not complete the secure check. Try an updated browser.');
    } finally {
      setPending(false);
    }
  }

  const card = (
      <section className="relative w-full max-w-xl rounded-3xl border border-white/15 bg-white/10 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
        <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-calm-200">
          <Lock className="h-5 w-5" />
        </div>

        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-calm-300">
          Private preview
        </p>
        <h1 className="font-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
          The Stay Project
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-ink-100">
          The Virtual Prevention Agent is temporarily password protected while a clinical review is
          completed.
        </p>

        <div className="mt-6 rounded-2xl border border-warm-300/30 bg-warm-700/20 p-5">
          <p className="font-semibold text-white">In crisis right now?</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-100">
            You do not need a password to get help. Call or text 988 in the United States, text
            HOME to 741741, or call your local emergency number.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href="tel:988"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-ink-900"
            >
              <Phone className="h-4 w-4" /> Call 988
            </a>
            <a
              href="sms:741741&body=HOME"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/30 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
            >
              <MessageCircle className="h-4 w-4" /> Text HOME to 741741
            </a>
          </div>
        </div>

        <form className="mt-8" onSubmit={handleSubmit}>
          <label htmlFor="site-password" className="text-sm font-medium text-white">
            Preview password
          </label>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              id="site-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              className="min-h-12 flex-1 rounded-full border border-white/20 bg-white/10 px-5 text-white outline-none placeholder:text-ink-300 focus:border-calm-300 focus:ring-2 focus:ring-calm-300/30"
              placeholder="Enter password"
            />
            <button
              type="submit"
              disabled={pending}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-7 font-semibold text-ink-900 transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {pending ? 'Checking…' : 'Unlock'}
            </button>
          </div>
          {error && (
            <p className="mt-3 text-sm font-medium text-warm-100" role="alert">
              {error}
            </p>
          )}
        </form>
      </section>
  );

  if (embedded) {
    return (
      <div className="flex items-center justify-center bg-ink-900 px-4 py-10 text-white">
        {card}
      </div>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink-900 px-6 py-12 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-16 h-96 w-96 rounded-full bg-glow-500/20 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-[28rem] w-[28rem] rounded-full bg-calm-400/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-[24rem] w-[24rem] rounded-full bg-care-400/10 blur-3xl" />
      </div>
      {card}
    </main>
  );
}
