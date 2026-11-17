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
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ text: 'Once upon a time, a little fox slept.' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ audio: 'AAAA' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const audio = await generateCalmingStory('Gentle Forest');

    const first = JSON.parse((fetchMock.mock.calls[0] as any)[1].body);
    expect(first.feature).toBe('calm-story-text');
    expect(JSON.stringify(first.contents)).toContain('Gentle Forest');
    expect(JSON.stringify(first.contents)).toContain('young child');
    expect(JSON.stringify(first.contents)).not.toMatch(/\{childName\}|\{theme\}/);

    // The speech step reads out the written story and nothing else.
    const second = JSON.parse((fetchMock.mock.calls[1] as any)[1].body);
    expect(second.feature).toBe('calm-story');
    expect(JSON.stringify(second.contents)).toContain('little fox');
    expect(audio).toBe('AAAA');
  });
});
