import { useCallback, useState } from 'react';
import type { UseCompanionChat } from './use-companion-chat';
import { useRealtimeVoice } from './use-realtime-voice';
import { useVoiceSession, type UseVoiceSession } from './use-voice-session';

export type VoiceEngine = 'realtime' | 'browser';

export interface UseEmberVoiceOptions {
  chat: UseCompanionChat;
  greeting: string;
  /** Zero's session-minting endpoint. Empty disables the realtime engine. */
  realtimeSessionUrl: string;
  getContext: () => { localHour: number; memory: string | null };
}

export interface UseEmberVoice extends UseVoiceSession {
  engine: VoiceEngine;
}

/**
 * Picks Ember's best available voice: Zero's realtime voice when the
 * endpoint is reachable, otherwise the browser's own speech engines. The
 * switch happens once, on the first failure to mint a session.
 */
export function useEmberVoice({ chat, greeting, realtimeSessionUrl, getContext }: UseEmberVoiceOptions): UseEmberVoice {
  const [engine, setEngine] = useState<VoiceEngine>(realtimeSessionUrl ? 'realtime' : 'browser');
  const fallBack = useCallback(() => setEngine('browser'), []);

  const realtime = useRealtimeVoice({ chat, sessionUrl: realtimeSessionUrl, getContext, greeting, onUnavailable: fallBack });
  const browser = useVoiceSession({ chat, greeting });

  const active = engine === 'realtime' ? realtime : browser;
  return { ...active, engine };
}
