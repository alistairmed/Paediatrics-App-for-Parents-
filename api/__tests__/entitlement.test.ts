import { describe, test, expect } from 'vitest';
import { mintEntitlementToken, verifyEntitlementToken, bearerToken, EntitlementClaims } from '../_lib/entitlement';
import { MemoryUsageStore, monthlyKey } from '../_lib/usageStore';

const SECRET = 'test-secret-that-is-at-least-32-characters-long';
const NOW = Date.parse('2026-11-01T00:00:00Z');
const claims = (over: Partial<EntitlementClaims> = {}): EntitlementClaims => ({
  sub: 'tester', jti: 'token-1', tier: 'premium', exp: NOW / 1000 + 3600, cap: 5, ...over,
});

describe('Entitlement tokens', () => {
  test('A minted token verifies and returns its claims', () => {
    const result = verifyEntitlementToken(mintEntitlementToken(claims(), SECRET), SECRET, NOW);
    expect(result).toEqual({ ok: true, claims: claims() });
  });

  test('Rejects a token signed with another secret', () => {
    const token = mintEntitlementToken(claims(), 'another-secret-that-is-also-32-characters!');
    expect(verifyEntitlementToken(token, SECRET, NOW)).toEqual({ ok: false, reason: 'signature' });
  });

  test('Rejects a token whose claims were edited', () => {
    const [prefix, , signature] = mintEntitlementToken(claims(), SECRET).split('.');
    const forged = Buffer.from(JSON.stringify(claims({ cap: 100000 }))).toString('base64url');
    expect(verifyEntitlementToken(`${prefix}.${forged}.${signature}`, SECRET, NOW)).toEqual({ ok: false, reason: 'signature' });
  });

  test('Rejects expired, malformed and missing tokens', () => {
    expect(verifyEntitlementToken(mintEntitlementToken(claims({ exp: NOW / 1000 - 1 }), SECRET), SECRET, NOW)).toEqual({ ok: false, reason: 'expired' });
    expect(verifyEntitlementToken('not-a-token', SECRET, NOW)).toEqual({ ok: false, reason: 'malformed' });
    expect(verifyEntitlementToken(null, SECRET, NOW)).toEqual({ ok: false, reason: 'missing' });
  });

  test('Rejects tokens with invalid claims', () => {
    expect(verifyEntitlementToken(mintEntitlementToken(claims({ cap: 0 }), SECRET), SECRET, NOW)).toEqual({ ok: false, reason: 'invalid' });
    expect(verifyEntitlementToken(mintEntitlementToken({ ...claims(), tier: 'free' as any }, SECRET), SECRET, NOW)).toEqual({ ok: false, reason: 'invalid' });
  });

  test('Refuses to work with a missing or short secret', () => {
    expect(verifyEntitlementToken('pp1.a.b', undefined, NOW)).toEqual({ ok: false, reason: 'server' });
    expect(verifyEntitlementToken('pp1.a.b', 'short', NOW)).toEqual({ ok: false, reason: 'server' });
    expect(() => mintEntitlementToken(claims(), 'short')).toThrow();
  });

  test('Reads bearer tokens', () => {
    expect(bearerToken('Bearer pp1.a.b')).toBe('pp1.a.b');
    expect(bearerToken('bearer   pp1.a.b ')).toBe('pp1.a.b');
    expect(bearerToken('Basic abc')).toBeNull();
    expect(bearerToken(undefined)).toBeNull();
  });
});

describe('Monthly usage store', () => {
  test('Counts per key and resets after the time to live', async () => {
    const store = new MemoryUsageStore();
    const key = monthlyKey('token-1', new Date(NOW));
    expect(key).toBe('premium:token-1:2026-11');
    expect(await store.increment(key, 60, NOW)).toBe(1);
    expect(await store.increment(key, 60, NOW)).toBe(2);
    expect(await store.increment('other', 60, NOW)).toBe(1);
    expect(await store.increment(key, 60, NOW + 61_000)).toBe(1);
  });
});
