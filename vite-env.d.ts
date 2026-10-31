/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "true" turns the AI features on (see config/features.ts). */
  readonly VITE_ENABLE_AI?: string;
}
