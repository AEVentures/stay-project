const stats = [
  {
    stat: '#2',
    label: 'Leading cause of death for ages 10–14 and 25–34 in the U.S.',
    source: 'CDC, National Vital Statistics System',
  },
  {
    stat: '~1 in 5',
    label: 'U.S. high school students have seriously considered suicide',
    source: 'CDC Youth Risk Behavior Survey',
  },
  {
    stat: '988',
    label: 'A free, confidential number anyone can call or text, 24/7',
    source: '988 Suicide & Crisis Lifeline',
  },
  {
    stat: '90%+',
    label: 'Of people who survive a suicide attempt do not go on to die by suicide later',
    source: 'Harvard T.H. Chan School of Public Health',
  },
];

export function Problem() {
  return (
    <section className="bg-ink-900 px-6 py-24 text-white">
      <div className="mx-auto max-w-6xl">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-glow-300">
          Why this matters
        </p>
        <h2 className="max-w-3xl font-display text-3xl font-semibold leading-tight sm:text-4xl">
          Suicide is preventable — and prevention works when people have the
          right information at the right moment.
        </h2>
        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="font-display text-4xl font-semibold text-glow-300">
                {s.stat}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ink-100">{s.label}</p>
              <p className="mt-4 text-xs uppercase tracking-wider text-ink-400">
                {s.source}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-8 max-w-3xl text-sm text-ink-300">
          Figures are widely cited public-health estimates and change year to
          year — see{' '}
          <a
            href="https://github.com/AEVentures/stay-project/blob/main/docs/RESOURCES.md"
            target="_blank"
            rel="noreferrer"
            className="underline decoration-white/40 underline-offset-2 hover:decoration-white"
          >
            docs/RESOURCES.md
          </a>{' '}
          for sourcing and links to official, up-to-date data.
        </p>
      </div>
    </section>
  );
}
