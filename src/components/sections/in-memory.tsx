import { siteConfig } from '@/config/site';

export function InMemory() {
  return (
    <section id="in-memory" className="relative bg-ink-900 px-6 py-28 text-ink-100">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-glow-500/20 blur-3xl" />
      </div>
      <div className="mx-auto max-w-3xl text-center">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-glow-300">
          In memory
        </p>
        <h2 className="font-display text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl">
          For everyone we've lost, and everyone still here
        </h2>
        <div className="mx-auto mt-8 h-px w-16 bg-glow-400/60" />
        <div className="mt-10 space-y-6 text-lg leading-relaxed text-ink-200">
          <p>
            This project exists because suicide takes people who are loved,
            missed, and irreplaceable — and because the right information at
            the right moment can be the difference between someone reaching
            out and someone going without help.
          </p>
          <p>
            We keep a quiet, opt-in memorial space for anyone who would like
            to add a name, a photo, or a few words in memory of someone they
            lost. It is entirely voluntary, and additions are made with care
            and consent — see{' '}
            <a
              href={`${siteConfig.repoUrl}/blob/main/docs/IN_MEMORY.md`}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-glow-300 underline decoration-glow-400/50 underline-offset-4 hover:decoration-glow-300"
            >
              docs/IN_MEMORY.md
            </a>{' '}
            for the guidelines.
          </p>
          <p className="font-display text-2xl italic text-white">
            "The Stay Project" — because the people we lose to suicide were
            never a burden, and the people who might be saved are worth
            building for.
          </p>
        </div>
      </div>
    </section>
  );
}
