import { siteConfig } from '@/config/site';

export function Footer() {
  return (
    <footer className="bg-ink-900 px-6 py-16 text-ink-200">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-2xl border border-warm-500/30 bg-warm-900/20 px-6 py-5 text-sm text-warm-100">
          <strong className="text-white">In crisis right now?</strong> Call or
          text{' '}
          <a href="tel:988" className="font-semibold underline">
            988
          </a>{' '}
          (US, 24/7), text HOME to{' '}
          <a href="sms:741741&body=HOME" className="font-semibold underline">
            741741
          </a>
          , or call your local emergency number. This website is an
          educational resource, not a crisis service.
        </div>

        <div className="mt-12 grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <a href="#top" className="font-display text-2xl font-semibold text-white">
              The Stay <span className="gradient-text">Project</span>
            </a>
            <p className="mt-4 max-w-md text-sm text-ink-300">
              Open, public suicide-prevention infrastructure, free for
              everyone. Part of{' '}
              <a
                href="https://github.com/AEVentures"
                target="_blank"
                rel="noreferrer"
                className="text-glow-300 hover:text-glow-200"
              >
                AEVentures
              </a>
              .
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-400">
              Project
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a href="#in-memory" className="text-ink-200 hover:text-white">
                  In Memory
                </a>
              </li>
              <li>
                <a href="#mission" className="text-ink-200 hover:text-white">
                  Mission
                </a>
              </li>
              <li>
                <a href="#get-involved" className="text-ink-200 hover:text-white">
                  Get involved
                </a>
              </li>
              <li>
                <a href="#support" className="text-ink-200 hover:text-white">
                  Support
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-400">
              Open
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a
                  href={siteConfig.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-ink-200 hover:text-white"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href={siteConfig.docsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-ink-200 hover:text-white"
                >
                  Docs
                </a>
              </li>
              <li>
                <a
                  href={siteConfig.resourcesUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-ink-200 hover:text-white"
                >
                  All resources
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/AEVentures/stay-project/blob/main/SECURITY.md"
                  target="_blank"
                  rel="noreferrer"
                  className="text-ink-200 hover:text-white"
                >
                  Security
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-ink-700 pt-6 text-center text-xs text-ink-400">
          The Stay Project is an independent, open-source project. Code is
          MIT-licensed. Content is shared for public benefit, in memory of
          everyone we've lost to suicide.
        </div>
      </div>
    </footer>
  );
}
