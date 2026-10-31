import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import handler from '../../api/gemini';
import { SAFETY_SYSTEM_INSTRUCTION } from '../prompts';

const call = async (body: any, headers: Record<string, string> = {}, method = 'POST') => {
  let status = 0, json: any;
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
});
