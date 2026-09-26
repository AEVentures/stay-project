/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the deployed Ember companion worker (no trailing slash). */
  readonly VITE_COMPANION_API_URL?: string;
  /** Endpoint that mints OpenAI Realtime client secrets for Ember's voice (Zero). Set to '' to disable. */
  readonly VITE_VOICE_SESSION_URL?: string;
}
