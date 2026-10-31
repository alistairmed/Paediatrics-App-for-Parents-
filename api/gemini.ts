import { withSafetyInstruction } from '../services/prompts.js';

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

// Only the models the app uses. Stops other callers spending the key on pricier models.
const ALLOWED_MODELS = ['gemini-2.5-flash'];
// The only tool the app uses (grounded answers). Other tools are dropped.
const ALLOWED_TOOLS = ['googleSearch'];

// Best-effort limit per client IP. State lives in this server instance only,
// so it slows abuse rather than guaranteeing a quota; for a hard limit, add a
// Vercel Firewall rate-limit rule on /api/gemini.
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // No CORS headers: the app calls this from the same origin, and browsers on
  // other sites are blocked from reading the response.
  // AI features are off unless explicitly enabled (see config/features.ts),
  // so the key can't be spent by scripts calling this endpoint directly.
  if (process.env.ENABLE_AI !== 'true') {
    return res.status(503).json({ error: 'AI features are switched off.' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Only POST requests are accepted.' });
  }

  // Browsers mark requests made by other websites; the app's own calls are same-origin.
  const fetchSite = header(req, 'sec-fetch-site');
  if (fetchSite && fetchSite !== 'same-origin' && fetchSite !== 'none') {
    return res.status(403).json({ error: 'Cross-site requests are not allowed.' });
  }

  const ip = (header(req, 'x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many AI requests. Please try again later.' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'Server configuration error: GEMINI_API_KEY environment variable is missing on Vercel.'
      });
    }

    // The safety instruction is enforced here too, so callers can't leave it out.
    const { model = 'gemini-2.5-flash', contents, config, systemInstruction } = withSafetyInstruction(req.body || {});

    if (!ALLOWED_MODELS.includes(model)) {
      return res.status(400).json({ error: `Model "${model}" is not allowed.` });
    }

    if (!contents) {
      return res.status(400).json({ error: 'Invalid request body: "contents" field is required.' });
    }

    // Standard Gemini v1beta API endpoint
    const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    // Construct standard payload for Gemini REST API
    const requestPayload: any = {
      contents: Array.isArray(contents) ? contents : [{ parts: typeof contents === 'string' ? [{ text: contents }] : [contents] }]
    };

    if (config) {
      if (Array.isArray(config.tools)) {
        const tools = config.tools.filter((t: any) => t && Object.keys(t).every(k => ALLOWED_TOOLS.includes(k)));
        if (tools.length) requestPayload.tools = tools;
      }
      
      const generationConfig: any = {};
      if (config.responseMimeType) generationConfig.responseMimeType = config.responseMimeType;
      if (config.responseSchema) generationConfig.responseSchema = config.responseSchema;
      if (config.responseModalities) generationConfig.responseModalities = config.responseModalities;
      if (config.speechConfig) generationConfig.speechConfig = config.speechConfig;
      if (config.temperature !== undefined) generationConfig.temperature = config.temperature;

      if (Object.keys(generationConfig).length > 0) {
        requestPayload.generationConfig = generationConfig;
      }
    }

    if (systemInstruction) {
      requestPayload.systemInstruction = typeof systemInstruction === 'string'
        ? { parts: [{ text: systemInstruction }] }
        : systemInstruction;
    }

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(requestPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: `Gemini API call failed with HTTP status ${response.status}`,
        details: errorText,
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err: any) {
    console.error('Error proxying Gemini API request:', err);
    return res.status(500).json({
      error: 'An internal server error occurred while contacting the Gemini API.',
      message: err?.message || String(err),
    });
  }
}
