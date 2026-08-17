export function Support() {
  return (
    <section id="support" className="bg-cream px-6 py-28">
      <div className="mx-auto max-w-4xl rounded-3xl border border-ink-100 bg-white p-10 text-center shadow-sm sm:p-14">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-calm-600">
          Support the project
        </p>
        <h2 className="font-display text-3xl font-semibold text-ink-800 sm:text-4xl">
          This project runs on volunteers and small donations.
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-ink-600">
          Tyler's Light does not sell data, run ads, or charge for any
          resource. If you would like to support hosting costs, translation
          work, or printed education kits, reach out and we'll point you to
          the right place.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <a
            href="mailto:hello@tylerslight.org?subject=Supporting%20Tyler's%20Light"
            className="inline-flex items-center gap-2 rounded-full bg-brand-gradient px-7 py-3.5 text-base font-medium text-ink-900 shadow-brand-glow transition-transform hover:-translate-y-0.5"
          >
            Get in touch
          </a>
          <a
            href="https://github.com/sponsors/AEVentures"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-7 py-3.5 text-base font-medium text-ink-800 transition-colors hover:border-calm-500 hover:text-calm-600"
          >
            GitHub Sponsors
          </a>
        </div>
      </div>
    </section>
  );
}
