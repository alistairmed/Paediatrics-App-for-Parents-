import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import handler from '../../api/gemini';
import { SAFETY_SYSTEM_INSTRUCTION } from '../prompts';

const call = async (body: any, headers: Record<string, string> = {}, method = 'POST') => {
  let status = 0, json: any;
  if (body && !('feature' in body)) body = { feature: 'parenting-tips', ...body };
  await handler({ method, body, headers: { 'x-forwarded-for': headers.ip || '1.1.1.1', ...headers } }, {
    setHeader: () => {},
    status: (code: number) => { status = code; return { json: (b: any) => { json = b; }, end: () => {} }; },
  });
  return { status, json };
};

describe('/api/gemini proxy', () => {
  const upstream = vi.fn();
  beforeEach(() => {
    upstream.mockReset();
    upstream.mockResolvedValue({ ok: true, json: async () => ({ candidates: [] }) });
    vi.stubGlobal('fetch', upstream);
    process.env.GEMINI_API_KEY = 'test-key';
    process.env.ENABLE_AI = 'true';
  });
  afterEach(() => { vi.unstubAllGlobals(); delete process.env.ENABLE_AI; });

  test('Refuses everything while AI is switched off', async () => {
    delete process.env.ENABLE_AI;
    expect((await call({ contents: 'hi' })).status).toBe(503);
    expect(upstream).not.toHaveBeenCalled();
  });

  test('Rejects requests a browser marks as cross-site', async () => {
    expect((await call({ contents: 'hi' }, { 'sec-fetch-site': 'cross-site', ip: '2.2.2.2' })).status).toBe(403);
    expect((await call({ contents: 'hi' }, { 'sec-fetch-site': 'same-origin', ip: '2.2.2.2' })).status).toBe(200);
  });

  test('Always sends the safety instruction upstream, even if the caller omits it', async () => {
    await call({ contents: 'Give me a dose', systemInstruction: 'Be brief.' }, { ip: '3.3.3.3' });
    const sent = JSON.parse(upstream.mock.calls[0][1].body);
    expect(sent.systemInstruction.parts[0].text).toBe(`${SAFETY_SYSTEM_INSTRUCTION}\n\nBe brief.`);
  });

  test('Only passes the Google Search tool through', async () => {
    await call({ contents: 'x', config: { tools: [{ googleSearch: {} }, { codeExecution: {} }] } }, { ip: '4.4.4.4' });
    expect(JSON.parse(upstream.mock.calls[0][1].body).tools).toEqual([{ googleSearch: {} }]);
  });

  test('Rate-limits a single IP after 20 requests in 10 minutes', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 21; i++) statuses.push((await call({ contents: 'x' }, { ip: '5.5.5.5' })).status);
    expect(statuses.slice(0, 20).every(s => s === 200)).toBe(true);
    expect(statuses[20]).toBe(429);
    expect((await call({ contents: 'x' }, { ip: '6.6.6.6' })).status).toBe(200);
  });

  test('Rejects other models', async () => {
    expect((await call({ model: 'gemini-3-pro', contents: 'x' }, { ip: '7.7.7.7' })).status).toBe(400);
  });

  test('Refuses a missing or unknown feature', async () => {
    expect((await call({ feature: undefined, contents: 'x' }, { ip: '8.8.8.1' })).status).toBe(400);
    expect((await call({ feature: 'anything', contents: 'x' }, { ip: '8.8.8.2' })).status).toBe(400);
    expect(upstream).not.toHaveBeenCalled();
  });

  test('Allows Google Search only for parenting tips and vaccine information', async () => {
    const search = { tools: [{ googleSearch: {} }] };
    expect((await call({ feature: 'parenting-tips', contents: 'x', config: search }, { ip: '9.9.9.1' })).status).toBe(200);
    expect((await call({ feature: 'vaccine-information', contents: 'x', config: search }, { ip: '9.9.9.2' })).status).toBe(200);
    for (const feature of ['medical-term', 'handover', 'report-reading', 'appointment-questions']) {
      expect((await call({ feature, contents: 'x', config: search }, { ip: '9.9.9.3' })).status).toBe(400);
    }
    expect((await call({ feature: 'handover', contents: 'x' }, { ip: '9.9.9.4' })).status).toBe(200);
    expect(upstream).toHaveBeenCalledTimes(3);
  });

  test("Doesn't send the feature name upstream", async () => {
    await call({ feature: 'handover', contents: 'x' }, { ip: '10.0.0.1' });
    expect(JSON.parse(upstream.mock.calls[0][1].body).feature).toBeUndefined();
  });

  test("Returns a generic message, not Google's error text", async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    upstream.mockResolvedValue({ ok: false, status: 403, text: async () => 'API key AIza-secret not valid for project 12345' });
    const { status, json } = await call({ contents: 'x' }, { ip: '10.0.0.2' });
    expect(status).toBe(403);
    expect(json).toEqual({ error: 'The AI service could not answer this request.', status: 403 });
    expect(JSON.stringify(json)).not.toMatch(/AIza|12345/);
    expect(log).toHaveBeenCalled();

    upstream.mockRejectedValue(new Error('getaddrinfo ENOTFOUND generativelanguage.googleapis.com'));
    const failed = await call({ contents: 'x' }, { ip: '10.0.0.3' });
    expect(failed).toEqual({ status: 500, json: { error: 'The AI service is not available right now.', status: 500 } });
    log.mockRestore();
  });
});
