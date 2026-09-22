import { ExternalLink, HeartHandshake, MessageCircle, Phone } from 'lucide-react';
import { siteConfig } from '@/config/site';

export function VirtualPreventionAgent() {
  return (
    <section id="virtual-prevention-agent" className="bg-ink-900 px-6 py-24 text-white sm:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div className="lg:sticky lg:top-24">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-calm-300">
              Virtual Prevention Agent
            </p>
            <h2 className="font-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
              A calm presence while you take the next step
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-200">
              Talk with Michael AI when you need a steady, nonjudgmental conversation. He can help
              you slow the moment down, find words for what you are feeling, and connect with a real
              person who can support you.
            </p>

            <div className="mt-8 rounded-2xl border border-warm-300/30 bg-warm-700/20 p-5">
              <p className="font-semibold text-white">This agent is not a crisis service or clinician.</p>
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
                  <Phone className="h-4 w-4" /> Call 988
                </a>
                <a
                  href="sms:988"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/30 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  <MessageCircle className="h-4 w-4" /> Text 988
                </a>
              </div>
            </div>

            <div className="mt-8 flex items-start gap-3 text-sm leading-relaxed text-ink-300">
              <HeartHandshake className="mt-0.5 h-5 w-5 flex-none text-calm-300" />
              <p>
                You do not need to explain everything at once. Start with what feels hardest right
                now, or simply say, “I need help getting through the next few minutes.”
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/15 bg-white shadow-2xl shadow-black/30">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 bg-white px-5 py-4 text-ink-800">
              <div>
                <p className="font-display text-xl font-semibold">Michael AI</p>
                <p className="text-xs text-ink-500">Supportive virtual conversation</p>
              </div>
              <a
                href={siteConfig.virtualPreventionAgentUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-ink-200 px-4 py-2 text-sm font-semibold text-ink-700 transition-colors hover:border-calm-500 hover:text-calm-700"
              >
                Open full screen <ExternalLink className="h-4 w-4" />
              </a>
            </div>
            <iframe
              src={siteConfig.virtualPreventionAgentUrl}
              title="Michael AI virtual prevention agent"
              allow="camera; microphone; autoplay; fullscreen"
              referrerPolicy="strict-origin-when-cross-origin"
              className="h-[720px] w-full bg-white sm:h-[780px]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
