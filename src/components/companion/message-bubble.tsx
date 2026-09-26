import { WifiOff } from 'lucide-react';
import type { ChatMessage } from '@/lib/companion';
import { cn } from '@/lib/utils';
import { EmberAvatar } from './ember-avatar';

export interface MessageBubbleProps {
  message: ChatMessage;
  streaming?: boolean;
}

export function MessageBubble({ message, streaming = false }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const showTyping = streaming && message.content.length === 0;

  return (
    <li className={cn('flex items-end gap-2.5', isUser && 'flex-row-reverse')}>
      {!isUser && (
        <div className="flex-none rounded-full bg-ink-900 p-1">
          <EmberAvatar size={28} mood={streaming ? 'thinking' : 'calm'} />
        </div>
      )}
      <div
        className={cn(
          'max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-[15px] leading-relaxed',
          isUser
            ? 'rounded-br-md bg-ink-800 text-white'
            : 'rounded-bl-md border border-ember-100 bg-ember-50/70 text-ink-800'
        )}
      >
        {message.offline && (
          <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink-600">
            <WifiOff className="h-3 w-3" aria-hidden /> Offline mode
          </p>
        )}
        {showTyping ? (
          <span className="inline-flex items-center gap-1 py-1" aria-label="Ember is thinking">
            <span className="h-1.5 w-1.5 rounded-full bg-ember-500 animate-dot-pulse" />
            <span className="h-1.5 w-1.5 rounded-full bg-ember-500 animate-dot-pulse [animation-delay:0.2s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-ember-500 animate-dot-pulse [animation-delay:0.4s]" />
          </span>
        ) : (
          message.content
        )}
      </div>
    </li>
  );
}
