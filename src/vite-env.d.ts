/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the deployed Ember companion worker (no trailing slash). */
  readonly VITE_COMPANION_API_URL?: string;
}
