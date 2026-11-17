import { describe, test, expect, vi, afterEach } from 'vitest';

vi.mock('../../config/features', () => ({ AI_ENABLED: true, PREMIUM_ENABLED: false }));
vi.mock('../aiGuard', () => ({
  ensureAiConsent: async () => true,
  takeAiQuota: () => true,
  getPremiumCode: () => null,
  AI_DAILY_LIMIT: 20,
}));

import { generateCalmingStory } from '../ai';
import { APP_PROMPTS } from '../prompts';

afterEach(() => vi.unstubAllGlobals());

describe('Calming story', () => {
  test('The prompt has no place for a child name', () => {
    expect(APP_PROMPTS.v1.calmingStory).not.toMatch(/childName|named/i);
  });

  test('Only the theme goes in the request', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ audio: 'AAAA' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await generateCalmingStory('Gentle Forest');

    const body = String((fetchMock.mock.calls[0] as unknown[])[1] && ((fetchMock.mock.calls[0] as any)[1].body));
    expect(body).toContain('Gentle Forest');
    expect(body).toContain('young child');
    expect(body).not.toMatch(/\{childName\}|\{theme\}/);
  });
});
