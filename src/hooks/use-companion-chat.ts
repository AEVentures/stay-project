import { useCallback, useEffect, useRef, useState } from 'react';
import {
  assessConversationRisk,
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

export interface UseCompanionChatOptions {
  apiUrl: string;
  greeting: string;
}

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
}

function makeMessage(role: ChatMessage['role'], content: string, offline = false): ChatMessage {
  return { id: crypto.randomUUID(), role, content, createdAt: Date.now(), offline };
}

export function useCompanionChat({ apiUrl, greeting }: UseCompanionChatOptions): UseCompanionChat {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [makeMessage('assistant', greeting)]);
  const [status, setStatus] = useState<CompanionStatus>('idle');
  const [risk, setRisk] = useState<RiskLevel>('none');
  const [lastError, setLastError] = useState<CompanionErrorCode | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const patchMessage = useCallback((id: string, patch: Partial<ChatMessage>) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }, []);

  const send = useCallback(
    async (rawText: string, options: SendOptions = {}): Promise<SendResult> => {
      const text = rawText.trim().slice(0, MAX_MESSAGE_CHARS);
      if (!text || status === 'streaming') return { text: '', offline: false, aborted: true };

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
        .filter((m) => !m.offline)
        .slice(-MAX_HISTORY_MESSAGES)
        .map(({ role, content }) => ({ role, content }));

      try {
        const full = await streamCompanionReply({
          apiUrl,
          messages: wire,
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
    setMessages([makeMessage('assistant', greeting)]);
    setStatus('idle');
    setRisk('none');
    setLastError(null);
  }, [greeting]);

  return { messages, status, risk, lastError, send, stop, reset };
}
