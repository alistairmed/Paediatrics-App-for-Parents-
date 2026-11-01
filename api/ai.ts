import { withSafetyInstruction } from '../services/prompts.js';
import { AI_FEATURES, AI_INPUT_LIMITS, AI_MODELS, isAiFeature } from '../config/aiFeatures.js';
import { bearerToken, verifyEntitlementToken } from './_lib/entitlement.js';
import { monthlyKey, MONTH_TTL_SECONDS, usageStore } from './_lib/usageStore.js';
import { callClaude, callGemini, measureParts, ProviderError, toParts } from './_lib/providers.js';

interface VercelRequest {
  method?: string;
  body?: any;
  headers?: Record<string, string | string[] | undefined>;
}

interface VercelResponse {
  setHeader(name: string, value: string): void;
  status(code: number): {
    json(body: any): void;
    end(): void;
  };
}

// Best-effort limit per client IP. State lives in this server instance only,
// so it slows abuse rather than guaranteeing a quota; for a hard limit, add a
// Vercel Firewall rate-limit rule on /api/ai (docs/AI_SAFEGUARDS.md).
const RATE_LIMIT = { max: 20, windowMs: 10 * 60 * 1000 };
const recentRequests = new Map<string, number[]>();

export function isRateLimited(ip: string, now = Date.now()): boolean {
  const windowStart = now - RATE_LIMIT.windowMs;
  const times = (recentRequests.get(ip) || []).filter(t => t > windowStart);
  const limited = times.length >= RATE_LIMIT.max;
  if (!limited) times.push(now);
  recentRequests.set(ip, times);
  if (recentRequests.size > 5000) recentRequests.clear(); // bound memory
  return limited;
}

const header = (req: VercelRequest, name: string): string | undefined => {
  const v = req.headers?.[name];
  return Array.isArray(v) ? v[0] : v;
};

const UNAVAILABLE = 'The AI service is not available right now.';

/** True when an Origin header names this deployment's own host. */
const sameHost = (req: VercelRequest, origin: string): boolean => {
  try {
    return new URL(origin).host === header(req, 'host');
  } catch {
    return false;
  }
};

/**
 * The single AI endpoint. Free features go to Gemini 2.5 Flash; premium
 * features go to Claude and need an entitlement token. Which tier a feature
 * needs comes from config/aiFeatures.ts, never from the caller.
 */
/**
 * Origins of the iOS and Android apps (Capacitor). They load the app from the
 * device, so their calls are cross-origin; only these get CORS headers.
 * Every other website stays blocked.
 */
export const NATIVE_APP_ORIGINS = ['capacitor://localhost', 'https://localhost', 'http://localhost'] as const;
const isNativeAppOrigin = (origin: string | undefined) => !!origin && (NATIVE_APP_ORIGINS as readonly string[]).includes(origin);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // The website calls this from the same origin and gets no CORS headers, so
  // browsers on other sites can't read the response. The native apps' origins
  // are allowed explicitly.
  const origin = header(req, 'origin');
  const nativeApp = isNativeAppOrigin(origin);
  if (nativeApp) {
    res.setHeader('Access-Control-Allow-Origin', origin!);
    res.setHeader('Vary', 'Origin');
  }

  if (req.method === 'OPTIONS') {
    // CORS preflight: only for the native apps.
    if (!nativeApp) return res.status(403).json({ error: 'Cross-site requests are not allowed.' });
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '600');
    return res.status(204).end();
  }

  // AI features are off unless explicitly enabled (see config/features.ts),
  // so the keys can't be spent by scripts calling this endpoint directly.
  if (process.env.ENABLE_AI !== 'true') {
    return res.status(503).json({ error: 'AI features are switched off.' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Only POST requests are accepted.' });
  }

  // Browsers mark requests made by other websites; the app's own calls are
  // same-origin, and the native apps' calls carry their own origin.
  const fetchSite = header(req, 'sec-fetch-site');
  const crossSite = (fetchSite && fetchSite !== 'same-origin' && fetchSite !== 'none') || (!!origin && !nativeApp && !sameHost(req, origin));
  if (crossSite && !nativeApp) {
    return res.status(403).json({ error: 'Cross-site requests are not allowed.' });
  }

  const ip = (header(req, 'x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many AI requests. Please try again later.' });
  }

  // The safety instruction is enforced here too, so callers can't leave it out.
  const { feature, tier, model: requestedModel, contents, config, systemInstruction } = withSafetyInstruction(req.body || {});

  if (!isAiFeature(feature)) {
    return res.status(400).json({ error: 'Unknown or missing feature.' });
  }
  const settings = AI_FEATURES[feature];
  if (tier !== 'free' && tier !== 'premium') {
    return res.status(400).json({ error: 'Unknown or missing tier.' });
  }
  if (tier !== settings.tier) {
    return res.status(403).json({ error: `This feature needs the ${settings.tier} tier.` });
  }

  const models: readonly string[] = AI_MODELS[tier];
  const model = requestedModel ?? models[0];
  if (!models.includes(model)) {
    return res.status(400).json({ error: 'This model is not allowed.' });
  }

  if (!contents) {
    return res.status(400).json({ error: 'Invalid request body: "contents" field is required.' });
  }

  const tools: any[] = Array.isArray(config?.tools) ? config.tools : [];
  const wantsSearch = tools.some(t => t && typeof t === 'object' && 'googleSearch' in t);
  if (wantsSearch && !('search' in settings && settings.search)) {
    return res.status(400).json({ error: 'Search is not allowed for this feature.' });
  }

  const parts = toParts(contents);
  const { textChars, imageChars } = measureParts(parts);
  if (textChars + systemInstruction.length > AI_INPUT_LIMITS.maxTextChars || imageChars > AI_INPUT_LIMITS.maxImageChars) {
    return res.status(413).json({ error: 'This request is too large.' });
  }

  try {
    if (tier === 'premium') {
      if (process.env.PREMIUM_ENABLED !== 'true') {
        return res.status(503).json({ error: 'Premium features are not available yet.' });
      }
      const check = verifyEntitlementToken(bearerToken(header(req, 'authorization')), process.env.ENTITLEMENT_SECRET);
      if ('reason' in check) {
        if (check.reason === 'server') {
          console.error('[api/ai] ENTITLEMENT_SECRET is missing or too short.');
          return res.status(503).json({ error: UNAVAILABLE });
        }
        return res.status(401).json({ error: 'A valid premium access code is needed.' });
      }
      // Premium is text-only: the app sends a de-identified summary, never images.
      if (imageChars > 0 || parts.some(p => !p.text)) {
        return res.status(400).json({ error: 'Premium features accept text only.' });
      }
      const used = await usageStore().increment(monthlyKey(check.claims.jti), MONTH_TTL_SECONDS);
      if (used > check.claims.cap) {
        return res.status(429).json({ error: "This access code has used this month's premium requests." });
      }

      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        console.error('[api/ai] ANTHROPIC_API_KEY is not set.');
        return res.status(500).json({ error: UNAVAILABLE, status: 500 });
      }
      const result = await callClaude({
        apiKey,
        model,
        text: parts.map(p => p.text).join('\n\n'),
        systemInstruction,
        maxTokens: settings.maxOutputTokens,
      });
      return res.status(200).json(result);
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      console.error('[api/ai] GEMINI_API_KEY is not set.');
      return res.status(500).json({ error: UNAVAILABLE, status: 500 });
    }
    const result = await callGemini({
      apiKey,
      model,
      parts,
      systemInstruction,
      maxOutputTokens: settings.maxOutputTokens,
      search: wantsSearch,
      config,
    });
    return res.status(200).json(result);
  } catch (err) {
    // Provider error text can describe keys, projects or accounts; keep it in the server log only.
    console.error('[api/ai] Provider error', err instanceof ProviderError ? err.message : err);
    if (err instanceof ProviderError) {
      const status = err.status >= 400 && err.status < 600 ? err.status : 502;
      return res.status(status).json({ error: 'The AI service could not answer this request.', status });
    }
    return res.status(500).json({ error: UNAVAILABLE, status: 500 });
  }
}
