import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { ember } from '@/config/ember';
import { useCompanionChat, useCompanionHealth, useVoiceSession } from '@/hooks';
import { cn } from '@/lib/utils';
import { CallEmber } from './call-ember';
import { CrisisStrip } from './crisis-strip';
import { EmberAvatar, type EmberMood } from './ember-avatar';
import { EmberStage } from './ember-stage';
import { ModeTabs, type CompanionMode } from './mode-tabs';
import { TextConversation } from './text-conversation';

export interface CompanionChatProps {
  apiUrl: string;
  className?: string;
}

/**
 * One conversation, three ways in: text, live voice with the animated
 * Ember, or a phone call. Switching modes never loses the thread.
 */
export function CompanionChat({ apiUrl, className }: CompanionChatProps) {
  const chat = useCompanionChat({ apiUrl, greeting: ember.greeting });
  const voice = useVoiceSession({ chat, greeting: ember.greeting });
  const health = useCompanionHealth(apiUrl);
  const [mode, setMode] = useState<CompanionMode>('text');
  const [draft, setDraft] = useState('');

  const streaming = chat.status === 'streaming';
  const hasUserMessages = chat.messages.some((m) => m.role === 'user');
  const online = Boolean(apiUrl) && health?.status !== 'unreachable' && health?.configured !== false;
  const mood: EmberMood =
    streaming || voice.phase === 'thinking' ? 'thinking' : draft.trim() || voice.phase === 'listening' ? 'listening' : 'calm';
  const lastReply = [...chat.messages].reverse().find((m) => m.role === 'assistant') ?? null;

  function changeMode(next: CompanionMode) {
    if (next !== 'voice' && voice.phase !== 'off') voice.stop();
    setMode(next);
  }

  function reset() {
    voice.stop();
    chat.reset();
  }

  return (
    <div
      className={cn(
        'flex h-[720px] flex-col overflow-hidden rounded-3xl border border-white/15 bg-white text-ink-800 shadow-2xl shadow-black/30 sm:h-[780px]',
        className
      )}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 bg-ink-900 px-4 py-3 text-white sm:px-5">
        <div className="flex items-center gap-3">
          <EmberAvatar size={44} mood={mood} energy={voice.energy} label="Ember, a small flame in a lantern" />
          <div>
            <p className="font-display text-xl font-semibold leading-tight">{ember.name}</p>
            <p className="text-xs text-ink-300">{ember.tagline}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ModeTabs mode={mode} onChange={changeMode} showCall={health?.phone === true} />
          <span
            className={cn(
              'hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium lg:inline-flex',
              online ? 'border-care-500/40 text-care-200' : 'border-ink-500 text-ink-300'
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', online ? 'bg-care-400' : 'bg-ink-400')} />
            {online ? 'AI character' : 'Offline mode'}
          </span>
          {hasUserMessages && (
            <button
              type="button"
              onClick={reset}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-ink-300 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Clear conversation"
              title="Clear conversation"
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>
      </header>

      <CrisisStrip risk={chat.risk} />

      {mode === 'text' && <TextConversation chat={chat} onDraftChange={setDraft} />}
      {mode === 'voice' && (
        <EmberStage
          phase={voice.phase}
          energy={voice.energy}
          interim={voice.interim}
          error={voice.error}
          support={voice.support}
          lastReply={lastReply}
          onStart={() => void voice.start()}
          onStop={voice.stop}
          onInterrupt={voice.interrupt}
        />
      )}
      {mode === 'call' && <CallEmber apiUrl={apiUrl} />}
    </div>
  );
}
