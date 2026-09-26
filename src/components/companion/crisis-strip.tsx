import { MessageCircle, Phone, Siren } from 'lucide-react';
import type { RiskLevel } from '@/lib/companion';
import { cn } from '@/lib/utils';

export interface CrisisStripProps {
  risk: RiskLevel;
}

const COPY: Record<RiskLevel, { title: string; body: string }> = {
  none: {
    title: 'A person is always one tap away.',
    body: 'Ember is an AI character, not a crisis line. 988 is free, confidential, and open 24/7 in the US.',
  },
  elevated: {
    title: 'You deserve a real person for this.',
    body: 'Ember will stay with you, and a trained counselor can too. Call or text 988 now. It is confidential and open around the clock.',
  },
  imminent: {
    title: 'Please reach a person right now.',
    body: 'If you might act on these thoughts or have already taken steps, call 988 or your local emergency number now. If you can, move away from anything you could use to hurt yourself and get near someone.',
  },
};

export function CrisisStrip({ risk }: CrisisStripProps) {
  const copy = COPY[risk];
  const urgent = risk !== 'none';

  return (
    <div
      role={urgent ? 'alert' : 'note'}
      aria-live={urgent ? 'assertive' : 'off'}
      className={cn(
        'border-b px-4 py-3 text-sm transition-colors sm:px-5',
        risk === 'none' && 'border-ink-100 bg-ink-50 text-ink-700',
        risk === 'elevated' && 'border-ember-200 bg-ember-50 text-ember-900',
        risk === 'imminent' && 'border-ember-300 bg-ember-100 text-ember-900'
      )}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 font-semibold">
            {risk === 'imminent' && <Siren className="h-4 w-4 flex-none" aria-hidden />}
            {copy.title}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed opacity-90">{copy.body}</p>
        </div>
        <div className="flex flex-none gap-2">
          <a
            href="tel:988"
            className={cn(
              'inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-transform hover:-translate-y-0.5 md:flex-none',
              urgent ? 'bg-ember-700 text-white' : 'bg-ink-900 text-white'
            )}
          >
            <Phone className="h-4 w-4" aria-hidden /> Call 988
          </a>
          <a
            href="sms:988"
            className={cn(
              'inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors md:flex-none',
              urgent
                ? 'border-ember-700/40 text-ember-900 hover:bg-ember-200/60'
                : 'border-ink-300 text-ink-800 hover:bg-ink-100'
            )}
          >
            <MessageCircle className="h-4 w-4" aria-hidden /> Text 988
          </a>
        </div>
      </div>
    </div>
  );
}
