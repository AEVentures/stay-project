import { siteConfig } from '@/config/site';

const tracks = [
  {
    title: 'Translate & localize',
    body: 'Translate warning signs, help scripts, and resource lists into more languages, and localize crisis lines by country.',
  },
  {
    title: 'Build the resource directory',
    body: 'Help us verify and expand a structured, machine-readable directory of crisis lines, warmlines, and support groups worldwide.',
  },
  {
    title: 'Design & accessibility',
    body: 'Improve readability, screen-reader support, and low-bandwidth/offline access for people in crisis on older devices.',
  },
  {
    title: 'Safe messaging review',
    body: 'If you have training in public health, journalism, or clinical suicide prevention, review our copy against WHO/AFSP safe-messaging guidelines.',
  },
  {
    title: 'Community education kits',
    body: 'Build printable, offline-friendly kits for schools, workplaces, faith communities, and youth organizations.',
  },
  {
    title: 'Tell Tyler\'s story',
    body: "Family and friends of Tyler McNeil are welcome to shape the dedication page — see docs/DEDICATION.md.",
  },
];

export function Tracks() {
  return (
    <section id="get-involved" className="bg-ink-900 px-6 py-28 text-white">
      <div className="mx-auto max-w-6xl">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-glow-300">
          Get involved
        </p>
        <h2 className="max-w-3xl font-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
          Ways to contribute
        </h2>
        <p className="mt-6 max-w-2xl text-lg text-ink-200">
          This is a volunteer, open-source project. Every contribution —
          code, words, translation, or review — helps someone find the right
          resource at the right moment.
        </p>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tracks.map((t) => (
            <div key={t.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="font-display text-xl font-semibold text-white">{t.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-200">{t.body}</p>
            </div>
          ))}
        </div>

        <a
          href={`${siteConfig.repoUrl}/blob/main/CONTRIBUTING.md`}
          target="_blank"
          rel="noreferrer"
          className="mt-12 inline-flex items-center gap-2 rounded-full bg-brand-gradient px-7 py-3.5 text-base font-medium text-ink-900 shadow-brand-glow transition-transform hover:-translate-y-0.5"
        >
          Read the contributing guide
        </a>
      </div>
    </section>
  );
}
