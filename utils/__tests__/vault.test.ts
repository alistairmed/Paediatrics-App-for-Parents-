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

describe('Vault with the iOS Keychain / Android Keystore', () => {
  beforeEach(() => { (globalThis as any).localStorage = new MemoryStorage(); });

  // Stands in for the secure store; survives "reloads" like the real Keychain.
  const makeStore = () => {
    const m = new Map<string, string>();
    return {
      items: m,
      get: async (k: string) => m.get(k) ?? null,
      set: async (k: string, v: string) => { m.set(k, v); },
      remove: async (k: string) => { m.delete(k); },
    };
  };
  const freshVault = async () => { vi.resetModules(); return import('../vault'); };

  test('An existing user\'s lock moves into secure storage and still opens with the same passcode', async () => {
    localStorage.setItem('pedipulse_history', '{"pastMedicalHistory":"Asthma"}');
    const web = await freshVault();
    await web.enableLock('123456', 1000);
    const encrypted = localStorage.getItem('pedipulse_history');
    expect(localStorage.getItem(web.LOCK_META_KEY)).not.toBeNull();

    // First start of the app version that uses secure storage.
    const store = makeStore();
    const app = await freshVault();
    await app.initVault(store);
    expect(store.items.has(app.LOCK_META_KEY)).toBe(true);
    expect(localStorage.getItem(app.LOCK_META_KEY)).toBeNull();
    expect(localStorage.getItem('pedipulse_history')).toBe(encrypted); // records untouched
    expect(app.isLockEnabled()).toBe(true);
    expect(await app.unlock('000000')).toBe(false);
    expect(await app.unlock('123456')).toBe(true);
    expect(app.readItem('pedipulse_history')).toBe('{"pastMedicalHistory":"Asthma"}');

    // Later starts read it from secure storage only.
    const again = await freshVault();
    await again.initVault(store);
    expect(again.isLockEnabled()).toBe(true);
    expect(await again.unlock('123456')).toBe(true);
  });

  test('Turning the lock on and off uses secure storage, not localStorage', async () => {
    localStorage.setItem('pedipulse_children', '{"children":[]}');
    const store = makeStore();
    const v = await freshVault();
    await v.initVault(store);
    await v.enableLock('123456', 1000);
    expect(localStorage.getItem(v.LOCK_META_KEY)).toBeNull();
    expect(store.items.has(v.LOCK_META_KEY)).toBe(true);
    expect(await v.disableLock('123456')).toBe(true);
    expect(store.items.has(v.LOCK_META_KEY)).toBe(false);
    expect(v.isLockEnabled()).toBe(false);
    expect(localStorage.getItem('pedipulse_children')).toBe('{"children":[]}');
  });

  test('If secure storage already has the lock, a stale localStorage copy is removed, not used', async () => {
    const store = makeStore();
    const v = await freshVault();
    await v.initVault(store);
    await v.enableLock('123456', 1000);
    const kept = store.items.get(v.LOCK_META_KEY);
    localStorage.setItem(v.LOCK_META_KEY, '{"stale":true}');
    const again = await freshVault();
    await again.initVault(store);
    expect(store.items.get(v.LOCK_META_KEY)).toBe(kept);
    expect(localStorage.getItem(v.LOCK_META_KEY)).toBeNull();
  });

  test('Factory reset also clears the secure-storage items', async () => {
    (globalThis as any).window = { location: { reload: vi.fn() } };
    const store = makeStore();
    const v = await freshVault();
    await v.initVault(store);
    await v.enableLock('123456', 1000);
    v.registerSecureKey('bio-key');
    store.items.set('bio-key', 'secret');
    await v.eraseAllData();
    expect(store.items.size).toBe(0);
    expect(v.isLockEnabled()).toBe(false);
    expect((globalThis as any).window.location.reload).toHaveBeenCalled();
    delete (globalThis as any).window;
  });
});

describe('Biometric unlock key', () => {
  beforeEach(() => { (globalThis as any).localStorage = new MemoryStorage(); });
  const freshVault = async () => { vi.resetModules(); return import('../vault'); };

  test('The exported key unlocks the records; a wrong passcode exports nothing', async () => {
    localStorage.setItem('pedipulse_history', '{"allergies":["egg"]}');
    const v = await freshVault();
    await v.enableLock('123456', 1000);
    expect(await v.exportKeyForBiometrics('000000')).toBeNull();
    const raw = await v.exportKeyForBiometrics('123456');
    expect(raw).toMatch(/^[A-Za-z0-9+/]+=*$/);

    const { importRawKey } = await import('../crypto');
    const later = await freshVault(); // app restarted, locked
    expect(later.isUnlocked()).toBe(false);
    expect(await later.unlockWithKey(await importRawKey(raw!))).toBe(true);
    expect(later.readItem('pedipulse_history')).toBe('{"allergies":["egg"]}');
  });

  test('A key from an old passcode no longer unlocks after the passcode changes', async () => {
    const v = await freshVault();
    await v.enableLock('123456', 1000);
    const old = await v.exportKeyForBiometrics('123456');
    expect(await v.disableLock('123456')).toBe(true);
    await v.enableLock('654321', 1000);
    const { importRawKey } = await import('../crypto');
    const later = await freshVault();
    expect(await later.unlockWithKey(await importRawKey(old!))).toBe(false);
    expect(later.isUnlocked()).toBe(false);
  });
});
