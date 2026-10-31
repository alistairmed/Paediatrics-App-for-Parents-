/**
 * Client-side safeguards that run before anything is sent to the AI service:
 * the parent's explicit consent, and a daily request cap per device.
 * The server keeps its own per-IP limit (api/gemini.ts); a hard limit needs a
 * Vercel Firewall rule (see docs/AI_SAFEGUARDS.md).
 */

export const AI_CONSENT_KEY = 'pedipulse_ai_consent';
export const AI_USAGE_KEY = 'pedipulse_ai_usage';
/** Bump when what is sent, or to whom, changes, so parents are asked again. */
export const AI_CONSENT_VERSION = '1';
export const AI_DAILY_LIMIT = 20;

type ConsentPrompt = () => Promise<boolean>;
let prompt: ConsentPrompt | null = null;

/** Registered by the app shell so the guard can show the consent dialog. */
export const setAiConsentPrompt = (fn: ConsentPrompt | null) => { prompt = fn; };

const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* storage unavailable */ } };

export const hasAiConsent = () => {
  try { return JSON.parse(read(AI_CONSENT_KEY) || 'null')?.version === AI_CONSENT_VERSION; } catch { return false; }
};

export const withdrawAiConsent = () => { try { localStorage.removeItem(AI_CONSENT_KEY); } catch { /* storage unavailable */ } };

/** Asks for consent if it hasn't been given. Resolves true only with consent. */
export async function ensureAiConsent(): Promise<boolean> {
  if (hasAiConsent()) return true;
  if (!prompt || !(await prompt())) return false;
  write(AI_CONSENT_KEY, JSON.stringify({ version: AI_CONSENT_VERSION, givenAt: new Date().toISOString() }));
  return true;
}

const today = (now: Date) => now.toISOString().slice(0, 10);

/** Counts a request against today's cap. Returns false once the cap is reached. */
export function takeAiQuota(now = new Date()): boolean {
  let usage = { date: today(now), count: 0 };
  try {
    const saved = JSON.parse(read(AI_USAGE_KEY) || 'null');
    if (saved?.date === usage.date && Number.isFinite(saved.count)) usage = saved;
  } catch { /* start a fresh count */ }
  if (usage.count >= AI_DAILY_LIMIT) return false;
  write(AI_USAGE_KEY, JSON.stringify({ date: usage.date, count: usage.count + 1 }));
  return true;
}
