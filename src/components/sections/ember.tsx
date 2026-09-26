import { HeartHandshake, MessageCircle, Phone, Sparkles } from 'lucide-react';
import { CompanionChat, EmberAvatar } from '@/components/companion';
import { ember } from '@/config/ember';
import { siteConfig } from '@/config/site';

const PRINCIPLES = [
  'Slows the moment down instead of rushing to fix it.',
  'Helps you find words for what you are carrying.',
  'Always points to a real person when the weight is too much.',
  'Never lectures, never guilts, never pretends to be human.',
];

export function Ember() {
  return (
    <section id="ember" className="relative overflow-hidden bg-ink-900 px-6 py-24 text-white sm:py-28">
      <div className="pointer-events-none absolute inset-0 -z-0">
        <div className="absolute -left-32 top-1/3 h-[30rem] w-[30rem] rounded-full bg-ember-500/15 blur-3xl animate-slow-pulse" />
        <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-calm-500/15 blur-3xl animate-slow-pulse [animation-delay:3s]" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div className="lg:sticky lg:top-24">
            <div className="mb-6 flex items-center gap-4">
              <EmberAvatar size={72} label="Ember, a small flame in a lantern" />
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember-300">
                Meet {ember.name}
              </p>
            </div>
            <h2 className="font-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
              A light that stays on through the night
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-200">
              {ember.name} is a small, steady flame, and a companion for the hours when everything
              else feels closed. Talk when you need a calm, nonjudgmental presence to help you get
              through the next few minutes and connect with a person who can help.
            </p>

            <ul className="mt-8 space-y-3">
              {PRINCIPLES.map((principle) => (
                <li key={principle} className="flex items-start gap-3 text-sm leading-relaxed text-ink-100">
                  <Sparkles className="mt-0.5 h-4 w-4 flex-none text-ember-300" aria-hidden />
                  {principle}
                </li>
              ))}
            </ul>

            <div className="mt-8 rounded-2xl border border-ember-300/30 bg-ember-700/15 p-5">
              <p className="font-semibold text-white">{ember.identity}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-100">
                If you may act on thoughts of suicide, cannot stay safe, or are in immediate danger,
                call emergency services now. In the United States, call or text 988 for trained,
                confidential crisis support.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href="tel:988"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-ink-900 transition-transform hover:-translate-y-0.5"
                >
                  <Phone className="h-4 w-4" aria-hidden /> Call 988
                </a>
                <a
                  href="sms:988"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/30 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden /> Text 988
                </a>
              </div>
            </div>

            <div className="mt-8 flex items-start gap-3 text-sm leading-relaxed text-ink-300">
              <HeartHandshake className="mt-0.5 h-5 w-5 flex-none text-calm-300" aria-hidden />
              <p>
                You do not need to explain everything at once. Start with what feels hardest right
                now, or simply say, “I need help getting through the next few minutes.”
              </p>
            </div>
          </div>

          <CompanionChat apiUrl={siteConfig.companionApiUrl} />
        </div>
      </div>
    </section>
  );
}
