import { describe, test, expect, beforeEach, vi } from 'vitest';
import {
  ensureAiConsent, hasAiConsent, withdrawAiConsent, setAiConsentPrompt, takeAiQuota, AI_DAILY_LIMIT,
} from '../aiGuard';

class MemoryStorage {
  private data = new Map<string, string>();
  get length() { return this.data.size; }
  key(i: number) { return [...this.data.keys()][i] ?? null; }
  getItem(k: string) { return this.data.get(k) ?? null; }
  setItem(k: string, v: string) { this.data.set(k, String(v)); }
  removeItem(k: string) { this.data.delete(k); }
  clear() { this.data.clear(); }
}

beforeEach(() => {
  vi.stubGlobal('localStorage', new MemoryStorage());
  setAiConsentPrompt(null);
});

describe('AI consent', () => {
  test('Nothing is allowed without a consent prompt', async () => {
    expect(await ensureAiConsent()).toBe(false);
  });

  test('Declining is not remembered as consent', async () => {
    const prompt = vi.fn().mockResolvedValue(false);
    setAiConsentPrompt(prompt);
    expect(await ensureAiConsent()).toBe(false);
    expect(hasAiConsent()).toBe(false);
  });

  test('Agreeing is remembered until withdrawn', async () => {
    const prompt = vi.fn().mockResolvedValue(true);
    setAiConsentPrompt(prompt);
    expect(await ensureAiConsent()).toBe(true);
    expect(await ensureAiConsent()).toBe(true);
    expect(prompt).toHaveBeenCalledTimes(1);
    withdrawAiConsent();
    expect(hasAiConsent()).toBe(false);
  });
});

describe('AI daily cap', () => {
  test(`Allows ${AI_DAILY_LIMIT} requests a day, then resets the next day`, () => {
    const day1 = new Date('2026-10-31T09:00:00Z');
    for (let i = 0; i < AI_DAILY_LIMIT; i++) expect(takeAiQuota(day1)).toBe(true);
    expect(takeAiQuota(day1)).toBe(false);
    expect(takeAiQuota(new Date('2026-11-01T09:00:00Z'))).toBe(true);
  });
});
