import Anthropic from '@anthropic-ai/sdk';

/** What /api/ai returns to the app, whichever provider answered. */
export interface AiResult {
  text: string;
  /** Web sources from Google Search grounding (free tier only). */
  sources: { web: { uri: string; title?: string } }[];
  /** Base64 audio, for the calming story. */
  audio?: string;
}

/** A provider failure. The details stay in the server log; callers see the status only. */
export class ProviderError extends Error {
  constructor(public status: number, detail: string) {
    super(detail);
  }
}

type Part = { text?: string; inlineData?: { mimeType?: string; data?: string } };

/** Flattens the app's Gemini-style `contents` into parts. */
export function toParts(contents: unknown): Part[] {
  if (typeof contents === 'string') return [{ text: contents }];
  const list = Array.isArray(contents) ? contents : [contents];
  return list.flatMap((item: any) => (Array.isArray(item?.parts) ? item.parts : [item])).filter(Boolean);
}

export function measureParts(parts: Part[]) {
  let textChars = 0, imageChars = 0;
  for (const part of parts) {
    if (typeof part.text === 'string') textChars += part.text.length;
    if (typeof part.inlineData?.data === 'string') imageChars += part.inlineData.data.length;
  }
  return { textChars, imageChars };
}

export interface GeminiRequest {
  apiKey: string;
  model: string;
  parts: Part[];
  systemInstruction: string;
  maxOutputTokens: number;
  search: boolean;
  config?: any;
}

export async function callGemini(req: GeminiRequest): Promise<AiResult> {
  const generationConfig: Record<string, unknown> = { maxOutputTokens: req.maxOutputTokens };
  const config = req.config || {};
  for (const key of ['responseMimeType', 'responseSchema', 'responseModalities', 'speechConfig', 'temperature']) {
    if (config[key] !== undefined) generationConfig[key] = config[key];
  }
  const body: Record<string, unknown> = {
    contents: [{ parts: req.parts }],
    systemInstruction: { parts: [{ text: req.systemInstruction }] },
    generationConfig,
  };
  if (req.search) body.tools = [{ googleSearch: {} }];

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${req.model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': req.apiKey },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new ProviderError(response.status, `Gemini ${response.status}: ${await response.text().catch(() => '')}`);
  }
  const data: any = await response.json();
  const candidate = data?.candidates?.[0];
  const parts: Part[] = candidate?.content?.parts || [];
  return {
    text: parts.map(p => p.text || '').join(''),
    sources: (candidate?.groundingMetadata?.groundingChunks || [])
      .filter((c: any) => typeof c?.web?.uri === 'string')
      .map((c: any) => ({ web: { uri: c.web.uri, title: c.web.title } })),
    audio: parts.find(p => p.inlineData?.data)?.inlineData?.data,
  };
}

export interface ClaudeRequest {
  apiKey: string;
  model: string;
  text: string;
  systemInstruction: string;
  maxTokens: number;
}

/** Premium tier: Anthropic Messages API, text only, no tools. */
export async function callClaude(req: ClaudeRequest): Promise<AiResult> {
  const client = new Anthropic({ apiKey: req.apiKey, timeout: 25_000, maxRetries: 1 });
  let message;
  try {
    message = await client.beta.messages.create({
      model: req.model,
      max_tokens: req.maxTokens,
      system: req.systemInstruction,
      messages: [{ role: 'user', content: req.text }],
      // If a safety classifier declines, the API retries on a suitable fallback model.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
    });
  } catch (err) {
    if (err instanceof Anthropic.APIError) throw new ProviderError(err.status ?? 502, `Anthropic ${err.status}: ${err.message}`);
    throw err;
  }
  if (message.stop_reason === 'refusal') {
    throw new ProviderError(422, `Anthropic refusal: ${message.stop_details?.category ?? 'unknown'}`);
  }
  const text = message.content.map(block => (block.type === 'text' ? block.text : '')).join('');
  return { text, sources: [] };
}
