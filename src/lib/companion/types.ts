export type Role = 'user' | 'assistant';

export type ChatMessage = {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
  /** True when the reply came from the offline fallback rather than the model. */
  offline?: boolean;
  /** True for Ember's small presence lines (silence check-ins); not sent to the model. */
  presence?: boolean;
};

export type WireMessage = {
  role: Role;
  content: string;
};

export type RiskLevel = 'none' | 'elevated' | 'imminent';

export type StreamEvent =
  | { type: 'token'; text: string }
  | { type: 'done' }
  | { type: 'error'; code: string; message: string };

export type CompanionStatus = 'idle' | 'streaming' | 'error';

export type CompanionErrorCode =
  | 'not_configured'
  | 'network'
  | 'rate_limited'
  | 'server'
  | 'aborted';

export class CompanionError extends Error {
  readonly code: CompanionErrorCode;

  constructor(code: CompanionErrorCode, message: string) {
    super(message);
    this.name = 'CompanionError';
    this.code = code;
  }
}

export const MAX_MESSAGE_CHARS = 2000;
export const MAX_HISTORY_MESSAGES = 30;
