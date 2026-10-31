/**
 * AI (Gemini) features are switched off until privacy and cost controls are
 * in place. With them off, nothing the user enters leaves the device.
 *
 * To turn them back on, set VITE_ENABLE_AI=true (read by the browser) and
 * ENABLE_AI=true (read by api/gemini.ts) in the environment, e.g. on Vercel.
 */
export const AI_ENABLED = import.meta.env.VITE_ENABLE_AI === 'true';
