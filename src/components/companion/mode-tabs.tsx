import { MessageSquareText, Mic, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CompanionMode = 'text' | 'voice' | 'call';

export interface ModeTabsProps {
  mode: CompanionMode;
  onChange: (mode: CompanionMode) => void;
  showCall: boolean;
}

const TABS: ReadonlyArray<{ id: CompanionMode; label: string; Icon: typeof Mic }> = [
  { id: 'text', label: 'Text', Icon: MessageSquareText },
  { id: 'voice', label: 'Voice', Icon: Mic },
  { id: 'call', label: 'Call', Icon: Phone },
];

export function ModeTabs({ mode, onChange, showCall }: ModeTabsProps) {
  return (
    <div role="tablist" aria-label="How to talk with Ember" className="flex gap-1 rounded-full bg-white/10 p-1">
      {TABS.filter((tab) => tab.id !== 'call' || showCall).map(({ id, label, Icon }) => {
        const selected = id === mode;
        return (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={selected}
            onClick={() => onChange(id)}
            className={cn(
              'inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors sm:px-4 sm:text-sm',
              selected ? 'bg-white text-ink-900' : 'text-ink-200 hover:bg-white/10 hover:text-white'
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            <span className={cn(!selected && 'sr-only sm:not-sr-only')}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
