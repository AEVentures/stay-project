import { Phone, ExternalLink } from 'lucide-react';
import { crisisLines } from '@/config/site';

export function Resources() {
  return (
    <section id="resources" className="bg-cream px-6 py-28">
      <div className="mx-auto max-w-5xl">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-warm-600">
          Crisis resources
        </p>
        <h2 className="max-w-3xl font-display text-4xl font-semibold leading-[1.1] tracking-tight text-ink-800 sm:text-5xl">
          Free, confidential, available right now
        </h2>
        <p className="mt-6 max-w-2xl text-lg text-ink-600">
          These are verified, public crisis lines. None of them require
          insurance, an appointment, or payment.
        </p>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {crisisLines.map((line) => (
            <a
              key={line.name}
              href={line.href}
              target={line.href.startsWith('http') ? '_blank' : undefined}
              rel={line.href.startsWith('http') ? 'noreferrer' : undefined}
              className="group flex items-start gap-4 rounded-2xl border border-ink-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-warm-300 hover:shadow-md"
            >
              <div className="mt-0.5 inline-flex h-10 w-10 flex-none items-center justify-center rounded-full bg-warm-100 text-warm-700">
                <Phone className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-ink-800">
                  {line.name}
                </h3>
                <p className="mt-1 text-sm font-medium text-warm-700">{line.detail}</p>
                <p className="mt-1 text-xs uppercase tracking-wider text-ink-400">
                  {line.region}
                </p>
              </div>
            </a>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-3 rounded-2xl border border-ink-100 bg-white px-6 py-5">
          <ExternalLink className="h-4 w-4 text-ink-500" />
          <p className="text-sm text-ink-600">
            Outside the U.S.? See the full, sourced list — including
            international and language-specific lines — in{' '}
            <a
              href="https://github.com/AEVentures/tylers-light/blob/main/docs/RESOURCES.md"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-calm-700 underline"
            >
              docs/RESOURCES.md
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
