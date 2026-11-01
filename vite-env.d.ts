/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "true" turns the AI features on (see config/features.ts). */
  readonly VITE_ENABLE_AI?: string;
  readonly VITE_PREMIUM_ENABLED?: string;
  /** Where the native apps reach /api/ai, e.g. https://paedspouch.com.au. Empty on the web (same-origin). */
  readonly VITE_API_BASE_URL?: string;
}
