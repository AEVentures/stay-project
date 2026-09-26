import { useCallback, useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { ember } from '@/config/ember';
import { siteConfig } from '@/config/site';
import { useCompanionChat, useCompanionHealth, useEmberVoice, useMemory } from '@/hooks';
import { buildGreeting, toModelContext } from '@/lib/memory';
import { cn } from '@/lib/utils';
import { CallEmber } from './call-ember';
import { CrisisStrip } from './crisis-strip';
import { EmberAvatar, type EmberMood } from './ember-avatar';
import { EmberStage } from './ember-stage';
import { MemoryMenu } from './memory-menu';
import { ModeTabs, type CompanionMode } from './mode-tabs';
import { StayPlan } from './stay-plan';
import { TextConversation } from './text-conversation';

export interface CompanionChatProps {
  apiUrl: string;
  className?: string;
}

const IDLE_CHECK_IN_MS = 90_000;
const REFLECT_EVERY_USER_TURNS = 3;

/**
 * One conversation, several ways in: text, live voice with the animated
 * Ember, a phone call, and the stay plan. Switching modes never loses the
 * thread, and with memory on, neither does leaving.
 */
export function CompanionChat({ apiUrl, className }: CompanionChatProps) {
  const memory = useMemory();
  const memoryRef = useRef(memory);
  memoryRef.current = memory;

  const getContext = useCallback(() => {
    const m = memoryRef.current;
    return {
      memory: m.state === 'on' ? toModelContext(m.memory) : null,
      localHour: new Date().getHours(),
    };
  }, []);
  const getVoiceContext = useCallback(() => {
    const { memory: mem, localHour } = getContext();
    return { memory: mem, localHour };
  }, [getContext]);

  const [mode, setMode] = useState<CompanionMode>('text');
  const chat = useCompanionChat({
    apiUrl,
    greeting: buildGreeting(null),
    getContext,
    idleCheckInMs: mode === 'text' ? IDLE_CHECK_IN_MS : null,
  });
  const voice = useEmberVoice({
    chat,
    greeting: chat.messages[0]?.content ?? ember.greeting,
    realtimeSessionUrl: siteConfig.voiceSessionUrl,
    getContext: getVoiceContext,
  });
  const health = useCompanionHealth(apiUrl);
  const [draft, setDraft] = useState('');

  // Once memory loads, let the opening line know who walked in.
  useEffect(() => {
    if (memory.state === 'on') chat.setGreeting(buildGreeting(memory.memory));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memory.state, memory.memory.visits, memory.memory.name]);

  // Reflect every few turns and when the tab is hidden, so memory survives an abrupt exit.
  const userTurns = chat.messages.filter((m) => m.role === 'user').length;
  const reflectedAt = useRef(0);
  const reflectNow = useCallback(() => {
    if (memoryRef.current.state !== 'on' || userTurns === 0 || reflectedAt.current === userTurns) return;
    reflectedAt.current = userTurns;
    void memoryRef.current.reflect(apiUrl, chat.toWire());
  }, [apiUrl, chat, userTurns]);

  useEffect(() => {
    if (chat.status === 'idle' && userTurns > 0 && userTurns % REFLECT_EVERY_USER_TURNS === 0) reflectNow();
  }, [chat.status, userTurns, reflectNow]);

  useEffect(() => {
    const onHide = () => document.visibilityState === 'hidden' && reflectNow();
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, [reflectNow]);

  const streaming = chat.status === 'streaming';
  const hasUserMessages = userTurns > 0;
  const online = Boolean(apiUrl) && health?.status !== 'unreachable' && health?.configured !== false;
  const mood: EmberMood =
    streaming || voice.phase === 'thinking' ? 'thinking' : draft.trim() || voice.phase === 'listening' ? 'listening' : 'calm';
  const lastReply = [...chat.messages].reverse().find((m) => m.role === 'assistant') ?? null;

  function changeMode(next: CompanionMode) {
    if (next !== 'voice' && voice.phase !== 'off') voice.stop();
    if (next !== mode) reflectNow();
    setMode(next);
  }

  function reset() {
    reflectNow();
    voice.stop();
    chat.reset();
    reflectedAt.current = 0;
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
            <p className="text-xs text-ink-300">
              {memory.state === 'on' && memory.memory.name ? `Here for you, ${memory.memory.name}` : ember.tagline}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <ModeTabs mode={mode} onChange={changeMode} showCall={health?.phone === true} />
          <span
            className={cn(
              'hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium xl:inline-flex',
              online ? 'border-care-500/40 text-care-200' : 'border-ink-500 text-ink-300'
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', online ? 'bg-care-400' : 'bg-ink-400')} />
            {online ? 'AI character' : 'Offline mode'}
          </span>
          <MemoryMenu
            state={memory.state}
            memory={memory.memory}
            onEnable={() => void memory.enable()}
            onDisable={() => void memory.disable()}
            onForget={() => void memory.forget()}
            onRename={(name) => void memory.rename(name)}
          />
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
          engine={voice.engine}
          onStart={() => void voice.start()}
          onStop={voice.stop}
          onInterrupt={voice.interrupt}
        />
      )}
      {mode === 'call' && <CallEmber apiUrl={apiUrl} />}
      {mode === 'plan' && (
        <StayPlan
          plan={memory.memory.plan}
          memoryState={memory.state}
          onChange={(plan) => void memory.updatePlan(plan)}
          onEnableMemory={() => void memory.enable()}
        />
      )}
    </div>
  );
}
