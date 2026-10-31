import { describe, test, expect, beforeEach, vi } from 'vitest';
import { deriveKey, encryptString, decryptString, isEncrypted, randomSalt } from '../crypto';

// Minimal localStorage for the vault (Node has no DOM).
class MemoryStorage {
  private m = new Map<string, string>();
  get length() { return this.m.size; }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
  clear() { this.m.clear(); }
}

describe('Passcode encryption', () => {
  test('Round-trips text, and a wrong passcode cannot decrypt', async () => {
    const salt = randomSalt();
    const key = await deriveKey('correct horse', salt, 1000);
    const enc = await encryptString(key, '{"allergies":["peanut"]}');
    expect(isEncrypted(enc)).toBe(true);
    expect(enc).not.toContain('peanut');
    expect(await decryptString(key, enc)).toBe('{"allergies":["peanut"]}');
    const wrong = await deriveKey('wrong horse', salt, 1000);
    await expect(decryptString(wrong, enc)).rejects.toThrow();
  });
});

describe('Vault', () => {
  beforeEach(() => { (globalThis as any).localStorage = new MemoryStorage(); });

  const freshVault = async () => {
    vi.resetModules(); // new module state, like a page reload
    return import('../vault');
  };

  test('Enabling the lock encrypts records; the key is not stored', async () => {
    localStorage.setItem('pedipulse_history', '{"pastMedicalHistory":"Asthma"}');
    localStorage.setItem('pedipulse_disclaimer_accepted', 'true');
    const v = await freshVault();
    await v.enableLock('123456', 1000);
    const stored = localStorage.getItem('pedipulse_history')!;
    expect(isEncrypted(stored)).toBe(true);
    expect(stored).not.toContain('Asthma');
    expect(localStorage.getItem('pedipulse_disclaimer_accepted')).toBe('true');
    expect(JSON.stringify((localStorage as any).m ? [...(localStorage as any).m] : [])).not.toContain('123456');
    expect(v.readItem('pedipulse_history')).toBe('{"pastMedicalHistory":"Asthma"}');
  });

  test('After a reload, records need the right passcode', async () => {
    localStorage.setItem('pedipulse_profile', '{"name":"Mia"}');
    await (await freshVault()).enableLock('123456', 1000);
    const reloaded = await freshVault();
    expect(reloaded.isLockEnabled()).toBe(true);
    expect(reloaded.isUnlocked()).toBe(false);
    expect(reloaded.readItem('pedipulse_profile')).toBeNull();
    expect(await reloaded.unlock('000000')).toBe(false);
    expect(await reloaded.unlock('123456')).toBe(true);
    expect(reloaded.readItem('pedipulse_profile')).toBe('{"name":"Mia"}');
  });

  test('Writes while unlocked are stored encrypted and survive a reload', async () => {
    const v = await freshVault();
    await v.enableLock('123456', 1000);
    await v.writeItem('pedipulse_history', '{"allergies":["egg"]}');
    expect(localStorage.getItem('pedipulse_history')).not.toContain('egg');
    const reloaded = await freshVault();
    await reloaded.unlock('123456');
    expect(reloaded.readItem('pedipulse_history')).toBe('{"allergies":["egg"]}');
  });

  test('Turning the lock off needs the passcode and restores plain records', async () => {
    localStorage.setItem('pedipulse_profile', '{"name":"Mia"}');
    const v = await freshVault();
    await v.enableLock('123456', 1000);
    expect(await v.disableLock('nope')).toBe(false);
    expect(await v.disableLock('123456')).toBe(true);
    expect(v.isLockEnabled()).toBe(false);
    expect(localStorage.getItem('pedipulse_profile')).toBe('{"name":"Mia"}');
  });
});
