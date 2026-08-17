import { ArrowRight, Github } from 'lucide-react';
import { siteConfig } from '@/config/site';

export function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-[90svh] items-center overflow-hidden pt-16"
    >
      {/* Ambient gradient orbs — light finding its way through dark. */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 top-24 h-96 w-96 rounded-full bg-glow-200 opacity-40 blur-3xl animate-slow-pulse" />
        <div className="absolute right-0 top-1/3 h-[28rem] w-[28rem] rounded-full bg-calm-200 opacity-40 blur-3xl animate-slow-pulse [animation-delay:2s]" />
        <div className="absolute bottom-0 left-1/3 h-[32rem] w-[32rem] rounded-full bg-warm-100 opacity-40 blur-3xl animate-slow-pulse [animation-delay:4s]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cream/60 to-cream" />
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 py-20">
        <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-ink-700 shadow-sm animate-fade-up">
          <span className="h-1.5 w-1.5 animate-flicker rounded-full bg-glow-500" />
          Open source · in memory of Tyler McNeil
        </p>
        <h1 className="max-w-4xl font-display text-5xl font-semibold leading-[1.05] tracking-tight text-ink-800 sm:text-6xl lg:text-7xl animate-fade-up [animation-delay:80ms]">
          No one should face the dark <span className="gradient-text">alone</span>.
        </h1>
        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-ink-600 sm:text-xl animate-fade-up [animation-delay:160ms]">
          Tyler's Light is a public, open-source effort to build free
          suicide-prevention resources, tools, and education — dedicated to
          the memory of Tyler McNeil. Everything here is free to use, free to
          copy, and free to improve, forever.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4 animate-fade-up [animation-delay:240ms]">
          <a
            href={siteConfig.repoUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-brand-gradient px-7 py-3.5 text-base font-medium text-ink-900 shadow-brand-glow transition-transform hover:-translate-y-0.5"
          >
            <Github className="h-4 w-4" /> Contribute on GitHub
            <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="#resources"
            className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white/70 px-7 py-3.5 text-base font-medium text-ink-800 backdrop-blur transition-colors hover:border-calm-500 hover:text-calm-600"
          >
            Find crisis resources
          </a>
          <a
            href="#dedication"
            className="inline-flex items-center gap-2 px-4 py-3.5 text-base font-medium text-ink-700 transition-colors hover:text-calm-600"
          >
            Read Tyler's story →
          </a>
        </div>

        <dl className="mt-16 grid max-w-2xl grid-cols-2 gap-6 sm:grid-cols-4 animate-fade-up [animation-delay:320ms]">
          <div>
            <dt className="text-xs uppercase tracking-wider text-ink-500">Approach</dt>
            <dd className="mt-1 font-display text-3xl text-ink-800">Open</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-ink-500">Cost</dt>
            <dd className="mt-1 font-display text-3xl text-ink-800">Free</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-ink-500">Audience</dt>
            <dd className="mt-1 font-display text-3xl text-ink-800">Everyone</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-ink-500">License</dt>
            <dd className="mt-1 font-display text-3xl text-ink-800">MIT</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
