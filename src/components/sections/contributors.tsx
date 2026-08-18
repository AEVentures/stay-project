import { useEffect, useState } from 'react';
import { Github } from 'lucide-react';

interface GithubContributor {
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
}

/**
 * Renders the real GitHub contributor list for this repository.
 * Allowlist-only: only AEVentures org members are guaranteed to show;
 * anyone who opens a merged PR will also appear via the GitHub API.
 */
export function Contributors() {
  const [contributors, setContributors] = useState<GithubContributor[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    fetch('https://api.github.com/repos/AEVentures/stay-project/contributors?per_page=100')
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data: GithubContributor[]) => {
        if (!cancelled) {
          setContributors(Array.isArray(data) ? data : []);
          setStatus('ready');
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="contributors" className="bg-white px-6 py-28">
      <div className="mx-auto max-w-6xl text-center">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-warm-600">
          Contributors
        </p>
        <h2 className="font-display text-4xl font-semibold leading-[1.1] tracking-tight text-ink-800 sm:text-5xl">
          Built by people who wanted to help
        </h2>

        {status === 'ready' && contributors.length > 0 && (
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6">
            {contributors.map((c) => (
              <a
                key={c.login}
                href={c.html_url}
                target="_blank"
                rel="noreferrer"
                className="group flex flex-col items-center gap-2"
                title={`${c.login} · ${c.contributions} contributions`}
              >
                <img
                  src={c.avatar_url}
                  alt={c.login}
                  className="h-16 w-16 rounded-full border-2 border-ink-100 transition-transform group-hover:-translate-y-1 group-hover:border-warm-400"
                  loading="lazy"
                />
                <span className="text-xs font-medium text-ink-600">{c.login}</span>
              </a>
            ))}
          </div>
        )}

        {status !== 'ready' && (
          <p className="mt-10 text-sm text-ink-500">
            {status === 'loading' ? 'Loading contributors…' : 'Contributor list unavailable right now.'}
          </p>
        )}

        <a
          href="https://github.com/AEVentures/stay-project"
          target="_blank"
          rel="noreferrer"
          className="mt-10 inline-flex items-center gap-2 rounded-full border border-ink-200 px-6 py-3 text-sm font-medium text-ink-700 transition-colors hover:border-calm-500 hover:text-calm-600"
        >
          <Github className="h-4 w-4" /> Become a contributor
        </a>
      </div>
    </section>
  );
}
