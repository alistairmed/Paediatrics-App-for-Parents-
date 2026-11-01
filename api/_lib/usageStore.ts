/**
 * Counts premium requests per token per month. The in-memory store lives in
 * one server instance only, so it is a best-effort cap; plug in a shared
 * store (for example Vercel KV: INCR on the key, then EXPIRE) with
 * setUsageStore before relying on the cap.
 */
export interface UsageStore {
  /** Adds one to the count for `key` and returns the new count. */
  increment(key: string, ttlSeconds: number): Promise<number>;
}

export class MemoryUsageStore implements UsageStore {
  private counts = new Map<string, { count: number; expiresAt: number }>();

  async increment(key: string, ttlSeconds: number, now = Date.now()): Promise<number> {
    const current = this.counts.get(key);
    const entry = current && current.expiresAt > now ? current : { count: 0, expiresAt: now + ttlSeconds * 1000 };
    entry.count += 1;
    this.counts.set(key, entry);
    if (this.counts.size > 10_000) this.prune(now);
    return entry.count;
  }

  private prune(now: number) {
    for (const [key, entry] of this.counts) if (entry.expiresAt <= now) this.counts.delete(key);
  }
}

let store: UsageStore = new MemoryUsageStore();
export const usageStore = () => store;
export const setUsageStore = (next: UsageStore) => { store = next; };

/** Key for a token's count in the current UTC month, e.g. `premium:abc:2026-11`. */
export const monthlyKey = (tokenId: string, now = new Date()) =>
  `premium:${tokenId}:${now.toISOString().slice(0, 7)}`;

/** Keeps a monthly count a little past the end of the longest month. */
export const MONTH_TTL_SECONDS = 32 * 24 * 60 * 60;
