import { useCallback, useEffect, useRef, useState } from 'react';
import { reflectConversation, type WireMessage } from '@/lib/companion';
import {
  applyDelta,
  clearMemory,
  emptyMemory,
  getMemoryConsent,
  isMemorySupported,
  loadMemory,
  recordVisit,
  saveMemory,
  setMemoryConsent,
  type Memory,
  type MemoryDelta,
  type StayPlan,
} from '@/lib/memory';

export type MemoryState = 'loading' | 'unsupported' | 'off' | 'on';

export interface UseMemory {
  state: MemoryState;
  memory: Memory;
  enable: () => Promise<void>;
  disable: () => Promise<void>;
  forget: () => Promise<void>;
  updatePlan: (plan: StayPlan) => Promise<void>;
  rename: (name: string | null) => Promise<void>;
  /** Distill a conversation into memory (no-op when memory is off or offline). */
  reflect: (apiUrl: string, messages: readonly WireMessage[]) => Promise<void>;
}

/**
 * Ember's memory of this person: opt-in, encrypted, on this device only.
 * Loading happens once per page; a visit is recorded when memory is on.
 */
export function useMemory(): UseMemory {
  const [state, setState] = useState<MemoryState>(isMemorySupported() ? 'loading' : 'unsupported');
  const [memory, setMemory] = useState<Memory>(emptyMemory);
  const memoryRef = useRef(memory);
  memoryRef.current = memory;
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    if (!isMemorySupported()) return;
    let cancelled = false;
    (async () => {
      const consent = await getMemoryConsent();
      if (cancelled) return;
      if (!consent) {
        setState('off');
        return;
      }
      const stored = recordVisit(await loadMemory());
      if (cancelled) return;
      setMemory(stored);
      setState('on');
      await saveMemory(stored);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Writes to disk only with consent; otherwise the change lives for this page only. */
  const persist = useCallback(async (next: Memory) => {
    setMemory(next);
    if (stateRef.current === 'on') await saveMemory(next);
  }, []);

  const enable = useCallback(async () => {
    await setMemoryConsent(true);
    stateRef.current = 'on';
    setState('on');
    await persist(recordVisit(memoryRef.current));
  }, [persist]);

  const disable = useCallback(async () => {
    await setMemoryConsent(false);
    setState('off');
  }, []);

  const forget = useCallback(async () => {
    await clearMemory();
    setMemory(emptyMemory());
    setState('off');
  }, []);

  const updatePlan = useCallback((plan: StayPlan) => persist({ ...memoryRef.current, plan }), [persist]);

  const rename = useCallback(
    (name: string | null) => persist({ ...memoryRef.current, name: name?.trim().slice(0, 40) || null }),
    [persist]
  );

  const reflect = useCallback(
    async (apiUrl: string, messages: readonly WireMessage[]) => {
      if (state !== 'on') return;
      const delta = (await reflectConversation(apiUrl, messages)) as MemoryDelta | null;
      if (!delta || typeof delta !== 'object') return;
      await persist(applyDelta(memoryRef.current, delta));
    },
    [persist, state]
  );

  return { state, memory, enable, disable, forget, updatePlan, rename, reflect };
}
