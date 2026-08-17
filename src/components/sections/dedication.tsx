import { siteConfig } from '@/config/site';

export function Dedication() {
  return (
    <section id="dedication" className="relative bg-ink-900 px-6 py-28 text-ink-100">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-glow-500/20 blur-3xl" />
      </div>
      <div className="mx-auto max-w-3xl text-center">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-glow-300">
          In loving memory
        </p>
        <h2 className="font-display text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl">
          Dedicated to Tyler McNeil
        </h2>
        <div className="mx-auto mt-8 h-px w-16 bg-glow-400/60" />
        <div className="mt-10 space-y-6 text-lg leading-relaxed text-ink-200">
          <p>
            This project exists because Tyler McNeil mattered, and because
            suicide takes people who are loved, missed, and irreplaceable.
            Tyler's Light is built in his memory, and in the hope that
            someone, somewhere, finds a reason to stay because a resource
            here reached them in time.
          </p>
          <p>
            We are keeping this space open for Tyler's family and friends to
            shape. If you knew Tyler and would like to add his story, a
            photo, or words in his memory, you can do so directly — see{' '}
            <a
              href={`${siteConfig.repoUrl}/blob/main/docs/DEDICATION.md`}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-glow-300 underline decoration-glow-400/50 underline-offset-4 hover:decoration-glow-300"
            >
              docs/DEDICATION.md
            </a>{' '}
            in the repository, or{' '}
            <a
              href={`${siteConfig.repoUrl}/issues/new`}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-glow-300 underline decoration-glow-400/50 underline-offset-4 hover:decoration-glow-300"
            >
              open an issue
            </a>{' '}
            and we will add it with care.
          </p>
          <p className="font-display text-2xl italic text-white">
            "Tyler's Light" — because the people we lose to suicide were never
            a burden, and the people who might be saved are worth building
            for.
          </p>
        </div>
      </div>
    </section>
  );
}
