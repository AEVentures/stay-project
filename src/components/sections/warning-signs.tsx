import { AlertTriangle, MessageSquareWarning, Moon, TrendingDown, UserX, Wine } from 'lucide-react';

const signs = [
  {
    icon: MessageSquareWarning,
    title: 'Talking about wanting to die',
    body: "Or feeling like a burden, having no reason to live, or being trapped in unbearable pain.",
  },
  {
    icon: TrendingDown,
    title: 'Sudden mood changes',
    body: 'Deep sadness, anxiety, agitation, rage — or an unexpected sense of calm after a period of depression.',
  },
  {
    icon: UserX,
    title: 'Withdrawing',
    body: 'Pulling away from friends, family, and activities they used to care about.',
  },
  {
    icon: Wine,
    title: 'Increased substance use',
    body: 'Using alcohol or drugs more often or more heavily than before.',
  },
  {
    icon: Moon,
    title: 'Changes in sleep',
    body: 'Sleeping far more or far less than usual, or major changes in eating habits.',
  },
  {
    icon: AlertTriangle,
    title: 'Giving things away or saying goodbye',
    body: 'Putting affairs in order, giving away possessions, or saying goodbye as if for the last time.',
  },
];

export function WarningSigns() {
  return (
    <section id="warning-signs" className="bg-cream px-6 py-28">
      <div className="mx-auto max-w-6xl">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-warm-600">
          Recognize the signs
        </p>
        <h2 className="max-w-3xl font-display text-4xl font-semibold leading-[1.1] tracking-tight text-ink-800 sm:text-5xl">
          Warning signs worth taking seriously
        </h2>
        <p className="mt-6 max-w-2xl text-lg text-ink-600">
          No single sign means someone is suicidal, but a combination — or any
          sudden, unexplained change — is worth a direct, caring
          conversation.
        </p>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {signs.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-2xl border border-ink-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-warm-100 text-warm-700">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-xl font-semibold text-ink-800">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">{body}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 rounded-2xl border border-warm-200 bg-warm-50 px-6 py-5 text-warm-800">
          <p className="font-semibold">If someone is in immediate danger, do not leave them alone.</p>
          <p className="mt-1 text-sm">
            Call 911 (US) or your local emergency number, or call/text 988,
            and remove access to lethal means if you safely can.
          </p>
        </div>
      </div>
    </section>
  );
}
