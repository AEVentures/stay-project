const phases = [
  {
    phase: 'Now',
    title: 'Launch the resource site',
    items: [
      'Verified crisis-line directory (US + international)',
      'Warning signs & how-to-help guides',
      'Open-source repository & contribution process',
    ],
  },
  {
    phase: 'Next',
    title: 'Structured, reusable data',
    items: [
      'Machine-readable JSON directory of crisis lines by country/language',
      'Embeddable "Get Help" widget other sites can drop in for free',
      'Printable community education kits (PDF, offline-friendly)',
    ],
  },
  {
    phase: 'Later',
    title: 'Reach communities directly',
    items: [
      'Partnerships with schools, faith groups, and employers to distribute kits',
      'Localized versions in additional languages',
      'A permanent memorial and story page shaped by Tyler\'s family and friends',
    ],
  },
];

export function Roadmap() {
  return (
    <section id="roadmap" className="bg-white px-6 py-28">
      <div className="mx-auto max-w-6xl">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-calm-600">
          Roadmap
        </p>
        <h2 className="max-w-3xl font-display text-4xl font-semibold leading-[1.1] tracking-tight text-ink-800 sm:text-5xl">
          Where this is headed
        </h2>
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {phases.map((p) => (
            <div key={p.phase} className="rounded-2xl border border-ink-100 bg-cream p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-warm-600">
                {p.phase}
              </p>
              <h3 className="mt-2 font-display text-2xl font-semibold text-ink-800">
                {p.title}
              </h3>
              <ul className="mt-4 space-y-2 text-sm text-ink-600">
                {p.items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-calm-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
