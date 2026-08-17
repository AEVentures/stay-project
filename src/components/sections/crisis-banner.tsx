import { useState } from 'react';
import { Phone, MessageCircle, X } from 'lucide-react';

/**
 * Persistent, always-visible crisis banner. Per safe-messaging guidance
 * (WHO, AFSP, 988), a prevention site should surface immediate help on
 * every page, not just the homepage. It can be collapsed but never
 * fully removed from the DOM, and it re-expands on reload.
 */
export function CrisisBanner() {
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        aria-label="Show crisis support options"
        className="fixed bottom-4 right-4 z-[60] inline-flex items-center gap-2 rounded-full bg-warm-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5"
      >
        <Phone className="h-4 w-4" /> Need help now?
      </button>
    );
  }

  return (
    <div className="relative z-[60] bg-warm-700 px-4 py-2.5 text-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-1 text-center text-sm">
        <span className="font-semibold">
          If you are thinking about suicide or are in crisis, help is available right now.
        </span>
        <a
          href="tel:988"
          className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 font-semibold hover:bg-white/25"
        >
          <Phone className="h-3.5 w-3.5" /> Call or text 988 (US)
        </a>
        <a
          href="sms:741741&body=HOME"
          className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 font-semibold hover:bg-white/25"
        >
          <MessageCircle className="h-3.5 w-3.5" /> Text HOME to 741741
        </a>
        <a href="#resources" className="underline decoration-white/50 underline-offset-2 hover:decoration-white">
          More resources & international lines
        </a>
      </div>
      <button
        onClick={() => setCollapsed(true)}
        aria-label="Collapse crisis banner"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 hover:bg-white/15"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
