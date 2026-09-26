import { useCallback, useEffect, useRef, useState } from 'react';
import {
  assessConversationRisk,
  type ChatContext,
  CompanionError,
  MAX_HISTORY_MESSAGES,
  MAX_MESSAGE_CHARS,
  offlineReply,
  streamCompanionReply,
  type ChatMessage,
  type CompanionErrorCode,
  type CompanionStatus,
  type RiskLevel,
  type WireMessage,
} from '@/lib/companion';
import { replyDelayMs, silenceLine } from '@/lib/memory';

export interface UseCompanionChatOptions {
  apiUrl: string;
  greeting: string;
  /** Extra context sent with each request (memory summary, local hour). */
  getContext?: () => ChatContext | undefined;
  /** When set, Ember notices silence after this long and says something small. */
  idleCheckInMs?: number | null;
}

const MAX_CHECK_INS = 2;

export type SendOptions = {
  /** Observe streamed tokens as they arrive (used by voice mode to speak early). */
  onToken?: (token: string) => void;
};

export type SendResult = {
  text: string;
  offline: boolean;
  aborted: boolean;
};

export interface UseCompanionChat {
  messages: ChatMessage[];
  status: CompanionStatus;
  risk: RiskLevel;
  lastError: CompanionErrorCode | null;
  send: (text: string, options?: SendOptions) => Promise<SendResult>;
  stop: () => void;
  reset: () => void;
  /** Replace the opening line while no one has spoken yet (e.g. once memory loads). */
  setGreeting: (text: string) => void;
  /** Wire-format history for reflection. */
  toWire: () => WireMessage[];
  /** Record a spoken turn that happened outside the text pipeline (voice mode). */
  appendTurn: (role: ChatMessage['role'], content: string) => void;
  /** Stream a spoken assistant turn into the last assistant bubble (voice mode). */
  appendAssistantDelta: (delta: string) => void;
}

function makeMessage(role: ChatMessage['role'], content: string, offline = false): ChatMessage {
  return { id: crypto.randomUUID(), role, content, createdAt: Date.now(), offline };
}

export function useCompanionChat({ apiUrl, greeting, getContext, idleCheckInMs = null }: UseCompanionChatOptions): UseCompanionChat {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [makeMessage('assistant', greeting)]);
  const [status, setStatus] = useState<CompanionStatus>('idle');
  const [risk, setRisk] = useState<RiskLevel>('none');
  const [lastError, setLastError] = useState<CompanionErrorCode | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const checkIns = useRef(0);
  const getContextRef = useRef(getContext);
  getContextRef.current = getContext;

  useEffect(() => () => abortRef.current?.abort(), []);

  // Presence: if the person goes quiet after Ember has replied, she says something small, at most twice.
  useEffect(() => {
    if (!idleCheckInMs || status !== 'idle' || checkIns.current >= MAX_CHECK_INS) return;
    const last = messages[messages.length - 1];
    if (!last || last.role !== 'assistant' || last.presence || !messages.some((m) => m.role === 'user')) return;
    const timer = window.setTimeout(() => {
      checkIns.current += 1;
      setMessages((prev) => [...prev, { ...makeMessage('assistant', silenceLine(prev.length)), presence: true }]);
    }, idleCheckInMs);
    return () => window.clearTimeout(timer);
  }, [idleCheckInMs, messages, status]);

  const patchMessage = useCallback((id: string, patch: Partial<ChatMessage>) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }, []);

  const send = useCallback(
    async (rawText: string, options: SendOptions = {}): Promise<SendResult> => {
      const text = rawText.trim().slice(0, MAX_MESSAGE_CHARS);
      if (!text || status === 'streaming') return { text: '', offline: false, aborted: true };

      checkIns.current = 0;
      const userMessage = makeMessage('user', text);
      const reply = makeMessage('assistant', '');
      const history = [...messages, userMessage];
      const nextRisk = assessConversationRisk(
        history.filter((m) => m.role === 'user').map((m) => m.content)
      );

      setRisk(nextRisk);
      setLastError(null);
      setStatus('streaming');
      setMessages([...history, reply]);

      const controller = new AbortController();
      abortRef.current = controller;

      const wire: WireMessage[] = history
        .filter((m) => !m.offline && !m.presence)
        .slice(-MAX_HISTORY_MESSAGES)
        .map(({ role, content }) => ({ role, content }));

      try {
        // A human pace: a beat before answering, longer for heavier messages, instant when it matters.
        await pause(replyDelayMs(text, nextRisk), controller.signal);
        const full = await streamCompanionReply({
          apiUrl,
          messages: wire,
          context: getContextRef.current?.(),
          signal: controller.signal,
          onToken: (token) => {
            options.onToken?.(token);
            setMessages((prev) =>
              prev.map((m) => (m.id === reply.id ? { ...m, content: m.content + token } : m))
            );
          },
        });
        setStatus('idle');
        if (full.trim()) return { text: full, offline: false, aborted: false };
        const fallback = offlineReply(nextRisk, history.length);
        patchMessage(reply.id, { content: fallback, offline: true });
        return { text: fallback, offline: true, aborted: false };
      } catch (error) {
        const code = error instanceof CompanionError ? error.code : 'server';
        if (code === 'aborted') {
          setMessages((prev) => prev.filter((m) => m.id !== reply.id || m.content.length > 0));
          setStatus('idle');
          return { text: '', offline: false, aborted: true };
        }
        setLastError(code);
        const fallback = offlineReply(nextRisk, history.length);
        patchMessage(reply.id, { content: fallback, offline: true });
        setStatus('error');
        return { text: fallback, offline: true, aborted: false };
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
      }
    },
    [apiUrl, messages, patchMessage, status]
  );

  const stop = useCallback(() => abortRef.current?.abort(), []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    checkIns.current = 0;
    setMessages([makeMessage('assistant', greeting)]);
    setStatus('idle');
    setRisk('none');
    setLastError(null);
  }, [greeting]);

  const setGreeting = useCallback((text: string) => {
    setMessages((prev) => (prev.some((m) => m.role === 'user') ? prev : [{ ...prev[0], content: text }]));
  }, []);

  const toWire = useCallback(
    () =>
      messages
        .filter((m) => !m.offline && !m.presence)
        .slice(-MAX_HISTORY_MESSAGES)
        .map(({ role, content }) => ({ role, content })),
    [messages]
  );

  const appendTurn = useCallback((role: ChatMessage['role'], content: string) => {
    const text = content.trim();
    if (!text) return;
    checkIns.current = 0;
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      // A streamed assistant turn already exists as a live bubble; finalize it instead of duplicating.
      if (role === 'assistant' && last?.role === 'assistant' && last.live) {
        return prev.map((m) => (m.id === last.id ? { ...m, content: text, live: false } : m));
      }
      const next = [...prev, makeMessage(role, text)];
      if (role === 'user') setRisk(assessConversationRisk(next.filter((m) => m.role === 'user').map((m) => m.content)));
      return next;
    });
  }, []);

  const appendAssistantDelta = useCallback((delta: string) => {
    if (!delta) return;
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.role === 'assistant' && last.live) {
        return prev.map((m) => (m.id === last.id ? { ...m, content: m.content + delta } : m));
      }
      return [...prev, { ...makeMessage('assistant', delta), live: true }];
    });
  }, []);

  return { messages, status, risk, lastError, send, stop, reset, setGreeting, toWire, appendTurn, appendAssistantDelta };
}

function pause(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted || ms <= 0) return resolve();
    const timer = window.setTimeout(resolve, ms);
    signal.addEventListener('abort', () => (window.clearTimeout(timer), resolve()), { once: true });
  });
}
