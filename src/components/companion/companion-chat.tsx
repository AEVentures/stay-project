import { type FormEvent, type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { RotateCcw, SendHorizonal, Square } from 'lucide-react';
import { ember } from '@/config/ember';
import { useCompanionChat } from '@/hooks';
import { MAX_MESSAGE_CHARS } from '@/lib/companion';
import { cn } from '@/lib/utils';
import { CrisisStrip } from './crisis-strip';
import { EmberAvatar, type EmberMood } from './ember-avatar';
import { MessageBubble } from './message-bubble';

export interface CompanionChatProps {
  apiUrl: string;
  className?: string;
}

export function CompanionChat({ apiUrl, className }: CompanionChatProps) {
  const chat = useCompanionChat({ apiUrl, greeting: ember.greeting });
  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLOListElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const streaming = chat.status === 'streaming';
  const hasUserMessages = chat.messages.some((m) => m.role === 'user');
  const mood: EmberMood = streaming ? 'thinking' : draft.trim() ? 'listening' : 'calm';

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [chat.messages]);

  async function submit(text: string) {
    setDraft('');
    await chat.send(text);
    inputRef.current?.focus();
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (draft.trim()) void submit(draft);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (draft.trim() && !streaming) void submit(draft);
    }
  }

  return (
    <div
      className={cn(
        'flex h-[720px] flex-col overflow-hidden rounded-3xl border border-white/15 bg-white text-ink-800 shadow-2xl shadow-black/30 sm:h-[780px]',
        className
      )}
    >
      <header className="flex items-center justify-between gap-3 border-b border-ink-100 bg-ink-900 px-5 py-3 text-white">
        <div className="flex items-center gap-3">
          <EmberAvatar size={44} mood={mood} label="Ember, a small flame in a lantern" />
          <div>
            <p className="font-display text-xl font-semibold leading-tight">{ember.name}</p>
            <p className="text-xs text-ink-300">{ember.tagline}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium sm:inline-flex',
              apiUrl ? 'border-care-500/40 text-care-200' : 'border-ink-500 text-ink-300'
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', apiUrl ? 'bg-care-400' : 'bg-ink-400')} />
            {apiUrl ? 'AI character' : 'Offline mode'}
          </span>
          {hasUserMessages && (
            <button
              type="button"
              onClick={chat.reset}
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

      <ol
        ref={listRef}
        aria-label="Conversation with Ember"
        aria-live="polite"
        className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-5"
      >
        {chat.messages.map((message, index) => (
          <MessageBubble
            key={message.id}
            message={message}
            streaming={streaming && index === chat.messages.length - 1}
          />
        ))}
      </ol>

      {!hasUserMessages && (
        <div className="flex flex-wrap gap-2 border-t border-ink-100 px-4 pt-3 sm:px-5">
          {ember.starters.map((starter) => (
            <button
              key={starter}
              type="button"
              onClick={() => void submit(starter)}
              className="min-h-11 rounded-full border border-ink-200 bg-white px-4 py-2 text-left text-[13px] text-ink-700 transition-colors hover:border-ember-400 hover:bg-ember-50 sm:text-sm"
            >
              {starter}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={onSubmit} className="border-t border-ink-100 px-4 py-3 sm:px-5">
        {chat.lastError && chat.lastError !== 'not_configured' && (
          <p className="mb-2 text-xs text-ink-500" role="status">
            Ember could not reach the AI model just now, so the reply above is built-in support. You
            can keep typing, and 988 is always available.
          </p>
        )}
        <div className="flex items-end gap-2">
          <label htmlFor="ember-input" className="sr-only">
            Message Ember
          </label>
          <textarea
            id="ember-input"
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            maxLength={MAX_MESSAGE_CHARS}
            placeholder="Say anything, or nothing yet."
            className="max-h-40 min-h-11 flex-1 resize-none rounded-2xl border border-ink-200 bg-ink-50 px-4 py-3 text-[15px] leading-relaxed text-ink-800 placeholder:text-ink-400 focus:border-ember-400 focus:outline-none focus:ring-2 focus:ring-ember-200"
          />
          {streaming ? (
            <button
              type="button"
              onClick={chat.stop}
              className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-full bg-ink-200 text-ink-800 transition-colors hover:bg-ink-300"
              aria-label="Stop Ember's reply"
            >
              <Square className="h-4 w-4" aria-hidden />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!draft.trim()}
              className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-full bg-ember-500 text-white shadow-lg shadow-ember-500/30 transition-all hover:-translate-y-0.5 hover:bg-ember-600 disabled:translate-y-0 disabled:opacity-40 disabled:shadow-none"
              aria-label="Send message"
            >
              <SendHorizonal className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-ink-500">{ember.privacyNote}</p>
      </form>
    </div>
  );
}
