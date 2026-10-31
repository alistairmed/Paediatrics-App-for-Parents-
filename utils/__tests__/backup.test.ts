import { describe, test, expect, beforeEach, vi } from 'vitest';

class MemoryStorage {
  m = new Map<string, string>();
  get length() { return this.m.size; }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
  clear() { this.m.clear(); }
}

const load = async () => {
  vi.resetModules();
  return { backup: await import('../backup'), vault: await import('../vault') };
};

describe('Backup', () => {
  beforeEach(() => { (globalThis as any).localStorage = new MemoryStorage(); });

  test('Backs up PediPulse records only, encrypted, and restores them', async () => {
    localStorage.setItem('pedipulse_profile', '{"name":"Mia"}');
    localStorage.setItem('pedipulse_history', '{"allergies":["peanut"]}');
    localStorage.setItem('other_app', 'not ours');
    const { backup } = await load();
    const file = await backup.createBackup('long-password', undefined, 1000);
    expect(file).not.toContain('Mia');
    expect(file).not.toContain('peanut');

    localStorage.clear();
    localStorage.setItem('pedipulse_history', '{"allergies":[]}');
    localStorage.setItem('pedipulse_extra', 'remove me');
    const { records } = await backup.readBackup(file, 'long-password');
    expect(Object.keys(records).sort()).toEqual(['pedipulse_history', 'pedipulse_profile']);
    await backup.restoreRecords(records);
    expect(localStorage.getItem('pedipulse_profile')).toBe('{"name":"Mia"}');
    expect(localStorage.getItem('pedipulse_history')).toBe('{"allergies":["peanut"]}');
    expect(localStorage.getItem('pedipulse_extra')).toBeNull();
  });

  test('Rejects a wrong password, a short password and a non-backup file', async () => {
    localStorage.setItem('pedipulse_profile', '{"name":"Mia"}');
    const { backup } = await load();
    await expect(backup.createBackup('short')).rejects.toThrow(/at least 8/);
    const file = await backup.createBackup('long-password', undefined, 1000);
    await expect(backup.readBackup(file, 'wrong-password')).rejects.toThrow("That password doesn't open this backup.");
    await expect(backup.readBackup('{"hello":1}', 'x')).rejects.toThrow(/isn't a PediPulse backup/);
    await expect(backup.readBackup('not json', 'x')).rejects.toThrow(/isn't a PediPulse backup/);
  });

  test('With the passcode lock on, backs up decrypted records and restores them encrypted', async () => {
    localStorage.setItem('pedipulse_history', '{"allergies":["egg"]}');
    const { backup, vault } = await load();
    await vault.enableLock('123456', 1000);
    const file = await backup.createBackup('long-password', undefined, 1000);
    const { records } = await backup.readBackup(file, 'long-password');
    expect(records.pedipulse_history).toBe('{"allergies":["egg"]}');
    expect(records).not.toHaveProperty(vault.LOCK_META_KEY);
    await backup.restoreRecords(records);
    expect(localStorage.getItem('pedipulse_history')).not.toContain('egg');
    expect(vault.readItem('pedipulse_history')).toBe('{"allergies":["egg"]}');
  });
});
