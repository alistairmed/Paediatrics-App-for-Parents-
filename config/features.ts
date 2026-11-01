/**
 * AI features are switched off until privacy and cost controls are in place.
 * With them off, nothing the user enters leaves the device.
 *
 * To turn them back on, set VITE_ENABLE_AI=true (read by the browser) and
 * ENABLE_AI=true (read by api/ai.ts) in the environment, e.g. on Vercel.
 */
export const AI_ENABLED = import.meta.env.VITE_ENABLE_AI === 'true';

/**
 * Premium AI features (Claude) need VITE_PREMIUM_ENABLED=true here and
 * PREMIUM_ENABLED=true on the server. While off, they show as
 * "Premium (coming soon)". There are no payments yet.
 */
export const PREMIUM_ENABLED = AI_ENABLED && import.meta.env.VITE_PREMIUM_ENABLED === 'true';
