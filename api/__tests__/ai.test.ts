import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

const claudeCreate = vi.fn();
vi.mock('@anthropic-ai/sdk', () => {
  class APIError extends Error {
    constructor(public status: number, message: string) { super(message); }
  }
  class Anthropic {
    static APIError = APIError;
    beta = { messages: { create: claudeCreate } };
    constructor(public options: unknown) {}
  }
  return { default: Anthropic, APIError };
});

import handler from '../ai';
import { mintEntitlementToken } from '../_lib/entitlement';
import { MemoryUsageStore, setUsageStore } from '../_lib/usageStore';
import { SAFETY_SYSTEM_INSTRUCTION } from '../../services/prompts';
import { AI_FEATURES } from '../../config/aiFeatures';
import Anthropic from '@anthropic-ai/sdk';

const SECRET = 'test-secret-that-is-at-least-32-characters-long';
let ipCounter = 0;
const freshIp = () => `10.0.${Math.floor(++ipCounter / 250)}.${ipCounter % 250}`;

const token = (over: Record<string, unknown> = {}) => mintEntitlementToken(
  { sub: 'tester', jti: `jti-${++ipCounter}`, tier: 'premium', exp: Date.now() / 1000 + 3600, cap: 3, ...over } as any, SECRET);

const call = async (body: any, headers: Record<string, string> = {}, method = 'POST') => {
  let status = 0, json: any;
  const sent: Record<string, string> = {};
  if (body && !('feature' in body)) body = { feature: 'parenting-tips', ...body };
  if (body && !('tier' in body) && body.feature in AI_FEATURES) body = { tier: (AI_FEATURES as any)[body.feature].tier, ...body };
  await handler({ method, body, headers: { 'x-forwarded-for': headers.ip || freshIp(), ...headers } }, {
    setHeader: (name: string, value: string) => { sent[name.toLowerCase()] = value; },
    status: (code: number) => { status = code; return { json: (b: any) => { json = b; }, end: () => {} }; },
  });
  return { status, json, headers: sent };
};

const premium = (body: any = {}, headers: Record<string, string> = {}) =>
  call({ feature: 'handover', contents: 'De-identified summary', ...body }, { authorization: `Bearer ${token()}`, ...headers });

describe('/api/ai', () => {
  const upstream = vi.fn();
  let log: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    upstream.mockReset();
    upstream.mockResolvedValue({ ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: 'ok' }] } }] }) });
    claudeCreate.mockReset();
    claudeCreate.mockResolvedValue({ stop_reason: 'end_turn', content: [{ type: 'text', text: 'Claude says hi' }] });
    vi.stubGlobal('fetch', upstream);
    setUsageStore(new MemoryUsageStore());
    log = vi.spyOn(console, 'error').mockImplementation(() => {});
    Object.assign(process.env, {
      GEMINI_API_KEY: 'test-key', ANTHROPIC_API_KEY: 'anthropic-key', ENABLE_AI: 'true',
      PREMIUM_ENABLED: 'true', ENTITLEMENT_SECRET: SECRET,
    });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    log.mockRestore();
    for (const k of ['ENABLE_AI', 'PREMIUM_ENABLED', 'ENTITLEMENT_SECRET', 'ANTHROPIC_API_KEY']) delete process.env[k];
  });

  describe('existing controls', () => {
    test('Refuses everything while AI is switched off', async () => {
      delete process.env.ENABLE_AI;
      expect((await call({ contents: 'hi' })).status).toBe(503);
      expect((await premium()).status).toBe(503);
      expect(upstream).not.toHaveBeenCalled();
      expect(claudeCreate).not.toHaveBeenCalled();
    });

    test('Only accepts POST', async () => {
      expect((await call({ contents: 'hi' }, {}, 'GET')).status).toBe(405);
    });

    test('Rejects requests a browser marks as cross-site', async () => {
      expect((await call({ contents: 'hi' }, { 'sec-fetch-site': 'cross-site' })).status).toBe(403);
      expect((await call({ contents: 'hi' }, { 'sec-fetch-site': 'same-origin' })).status).toBe(200);
    });

    test('Rate-limits a single IP after 20 requests in 10 minutes', async () => {
      const statuses: number[] = [];
      for (let i = 0; i < 21; i++) statuses.push((await call({ contents: 'x' }, { ip: '5.5.5.5' })).status);
      expect(statuses.slice(0, 20).every(s => s === 200)).toBe(true);
      expect(statuses[20]).toBe(429);
    });

    test('Always sends the safety instruction to Gemini, even if the caller omits it', async () => {
      await call({ contents: 'Give me a dose', systemInstruction: 'Be brief.' });
      const sent = JSON.parse(upstream.mock.calls[0][1].body);
      expect(sent.systemInstruction.parts[0].text).toBe(`${SAFETY_SYSTEM_INSTRUCTION}\n\nBe brief.`);
    });

    test('Always sends the safety instruction to Claude', async () => {
      await premium({ systemInstruction: 'Write for a GP.' });
      expect(claudeCreate.mock.calls[0][0].system).toBe(`${SAFETY_SYSTEM_INSTRUCTION}\n\nWrite for a GP.`);
    });

    test('Rejects models outside each allow-list', async () => {
      expect((await call({ model: 'gemini-3-pro', contents: 'x' })).status).toBe(400);
      expect((await premium({ model: 'claude-opus-5-5' })).status).toBe(400);
      expect((await premium({ model: 'gemini-2.5-flash' })).status).toBe(400);
    });

    test('Refuses a missing or unknown feature', async () => {
      expect((await call({ feature: undefined, contents: 'x' })).status).toBe(400);
      expect((await call({ feature: 'anything', tier: 'free', contents: 'x' })).status).toBe(400);
    });

    test('Google Search only for parenting tips and vaccine information', async () => {
      const search = { tools: [{ googleSearch: {} }] };
      expect((await call({ feature: 'parenting-tips', contents: 'x', config: search })).status).toBe(200);
      expect((await call({ feature: 'vaccine-information', contents: 'x', config: search })).status).toBe(200);
      expect((await call({ feature: 'medical-term', contents: 'x', config: search })).status).toBe(400);
      expect(JSON.parse(upstream.mock.calls[0][1].body).tools).toEqual([{ googleSearch: {} }]);
      expect((await call({ feature: 'medical-term', contents: 'x' })).status).toBe(200);
      expect(JSON.parse(upstream.mock.calls[2][1].body).tools).toBeUndefined();
    });

    test('Caps output tokens per feature and ignores a larger client value', async () => {
      await call({ feature: 'appointment-questions', contents: 'x', config: { maxOutputTokens: 100000 } });
      expect(JSON.parse(upstream.mock.calls[0][1].body).generationConfig.maxOutputTokens).toBe(AI_FEATURES['appointment-questions'].maxOutputTokens);
      await premium();
      expect(claudeCreate.mock.calls[0][0].max_tokens).toBe(AI_FEATURES.handover.maxOutputTokens);
    });

    test('Refuses requests over the input size cap', async () => {
      expect((await call({ contents: 'x'.repeat(30_000) })).status).toBe(413);
      expect((await premium({ contents: 'x'.repeat(30_000) })).status).toBe(413);
      expect(upstream).not.toHaveBeenCalled();
      expect(claudeCreate).not.toHaveBeenCalled();
    });

    test("Returns a generic message, not Gemini's error text", async () => {
      upstream.mockResolvedValue({ ok: false, status: 403, text: async () => 'API key AIza-secret not valid for project 12345' });
      const { status, json } = await call({ contents: 'x' });
      expect(status).toBe(403);
      expect(json).toEqual({ error: 'The AI service could not answer this request.', status: 403 });
      expect(log).toHaveBeenCalled();
    });

    test("Returns a generic message, not Anthropic's error text", async () => {
      claudeCreate.mockRejectedValue(new (Anthropic as any).APIError(401, 'invalid x-api-key sk-ant-secret'));
      const { status, json } = await premium();
      expect(status).toBe(401);
      expect(JSON.stringify(json)).not.toMatch(/sk-ant|x-api-key/);
      expect(json).toEqual({ error: 'The AI service could not answer this request.', status: 401 });
    });

    test('Network failures return a generic 500', async () => {
      upstream.mockRejectedValue(new Error('getaddrinfo ENOTFOUND generativelanguage.googleapis.com'));
      const { status, json } = await call({ contents: 'x' });
      expect({ status, json }).toEqual({ status: 500, json: { error: 'The AI service is not available right now.', status: 500 } });
    });
  });

  describe('tiers', () => {
    test('The server decides the tier: a premium feature sent as free is refused', async () => {
      expect((await call({ feature: 'handover', tier: 'free', contents: 'x' })).status).toBe(403);
      expect((await call({ feature: 'vaccine-information', tier: 'premium', contents: 'x' }, { authorization: `Bearer ${token()}` })).status).toBe(403);
      expect((await call({ feature: 'handover', tier: 'gold', contents: 'x' })).status).toBe(400);
      expect(upstream).not.toHaveBeenCalled();
      expect(claudeCreate).not.toHaveBeenCalled();
    });

    test('Free features go to Gemini 2.5 Flash', async () => {
      const { status, json } = await call({ feature: 'calm-story', contents: 'x' });
      expect(status).toBe(200);
      expect(json).toEqual({ text: 'ok', sources: [], audio: undefined });
      expect(upstream.mock.calls[0][0]).toContain('/models/gemini-2.5-flash:generateContent');
      expect(claudeCreate).not.toHaveBeenCalled();
    });

    test('Premium features go to Claude Sonnet 5.5 with no tools', async () => {
      const { status, json } = await premium();
      expect(status).toBe(200);
      expect(json).toEqual({ text: 'Claude says hi', sources: [] });
      const sent = claudeCreate.mock.calls[0][0];
      expect(sent.model).toBe('claude-sonnet-5-5');
      expect(sent.messages).toEqual([{ role: 'user', content: 'De-identified summary' }]);
      expect(sent.tools).toBeUndefined();
      expect(upstream).not.toHaveBeenCalled();
    });

    test('Google Search is refused on the Claude route', async () => {
      expect((await premium({ config: { tools: [{ googleSearch: {} }] } })).status).toBe(400);
      expect((await call({ feature: 'parenting-guidance', contents: 'x', config: { tools: [{ googleSearch: {} }] } }, { authorization: `Bearer ${token()}` })).status).toBe(400);
      expect(claudeCreate).not.toHaveBeenCalled();
    });

    test('Premium is text only', async () => {
      const image = [{ parts: [{ inlineData: { mimeType: 'image/jpeg', data: 'abc' } }, { text: 'x' }] }];
      expect((await premium({ contents: image })).status).toBe(400);
      expect(claudeCreate).not.toHaveBeenCalled();
    });

    test('A Claude refusal returns a generic error', async () => {
      claudeCreate.mockResolvedValue({ stop_reason: 'refusal', stop_details: { category: 'bio' }, content: [] });
      expect((await premium()).status).toBe(422);
    });
  });

  describe('premium access', () => {
    test('Premium returns 503 unless PREMIUM_ENABLED is "true"', async () => {
      process.env.PREMIUM_ENABLED = 'false';
      expect((await premium()).status).toBe(503);
      expect(claudeCreate).not.toHaveBeenCalled();
      expect((await call({ contents: 'x' })).status).toBe(200); // free still works
    });

    test('Needs a valid entitlement token', async () => {
      expect((await premium({}, { authorization: '' })).status).toBe(401);
      expect((await premium({}, { authorization: 'Bearer pp1.bad.token' })).status).toBe(401);
      expect((await premium({}, { authorization: `Bearer ${token({ exp: Date.now() / 1000 - 10 })}` })).status).toBe(401);
      const other = mintEntitlementToken({ sub: 'x', jti: 'y', tier: 'premium', exp: Date.now() / 1000 + 60, cap: 5 }, 'a-different-secret-that-is-32-characters!!');
      expect((await premium({}, { authorization: `Bearer ${other}` })).status).toBe(401);
      expect(claudeCreate).not.toHaveBeenCalled();
    });

    test('A missing server secret is a 503, not a pass', async () => {
      delete process.env.ENTITLEMENT_SECRET;
      expect((await premium()).status).toBe(503);
      expect(claudeCreate).not.toHaveBeenCalled();
    });

    test("Enforces each token's monthly cap", async () => {
      const capped = token({ cap: 2 });
      const statuses = [];
      for (let i = 0; i < 3; i++) statuses.push((await premium({}, { authorization: `Bearer ${capped}` })).status);
      expect(statuses).toEqual([200, 200, 429]);
      expect(claudeCreate).toHaveBeenCalledTimes(2);
      expect((await premium()).status).toBe(200); // another token has its own count
    });
  });

  describe('native apps (Capacitor)', () => {
    const NATIVE = ['capacitor://localhost', 'https://localhost', 'http://localhost'];

    test('The iOS and Android app origins can call the endpoint, with CORS headers', async () => {
      for (const origin of NATIVE) {
        const r = await call({ contents: 'x' }, { origin, 'sec-fetch-site': 'cross-site' });
        expect(r.status).toBe(200);
        expect(r.headers['access-control-allow-origin']).toBe(origin);
      }
    });

    test('Preflight is answered for the app origins only', async () => {
      const ok = await call(undefined, { origin: 'capacitor://localhost' }, 'OPTIONS');
      expect(ok.status).toBe(204);
      expect(ok.headers['access-control-allow-headers']).toContain('Authorization');
      const other = await call(undefined, { origin: 'https://evil.example' }, 'OPTIONS');
      expect(other.status).toBe(403);
      expect(other.headers['access-control-allow-origin']).toBeUndefined();
    });

    test('Other websites stay blocked, with or without Sec-Fetch-Site', async () => {
      for (const origin of ['https://evil.example', 'capacitor://evil', 'https://localhost.evil.example', 'http://localhost:3000']) {
        const r = await call({ contents: 'x' }, { origin, 'sec-fetch-site': 'cross-site' });
        expect(r.status).toBe(403);
        expect(r.headers['access-control-allow-origin']).toBeUndefined();
      }
      expect((await call({ contents: 'x' }, { origin: 'https://evil.example', host: 'paedspouch.com.au' })).status).toBe(403);
      expect(upstream).not.toHaveBeenCalled();
    });

    test('The website itself still works same-origin, without CORS headers', async () => {
      const r = await call({ contents: 'x' }, { origin: 'https://paedspouch.com.au', host: 'paedspouch.com.au', 'sec-fetch-site': 'same-origin' });
      expect(r.status).toBe(200);
      expect(r.headers['access-control-allow-origin']).toBeUndefined();
    });

    test('Every other control still applies to the app origins', async () => {
      delete process.env.ENABLE_AI;
      expect((await call({ contents: 'x' }, { origin: 'capacitor://localhost' })).status).toBe(503);
      process.env.ENABLE_AI = 'true';
      process.env.PREMIUM_ENABLED = 'false';
      expect((await premium({}, { origin: 'capacitor://localhost' })).status).toBe(503);
      expect((await call({ feature: 'medical-term', contents: 'x', config: { tools: [{ googleSearch: {} }] } }, { origin: 'https://localhost' })).status).toBe(400);
    });
  });
});
