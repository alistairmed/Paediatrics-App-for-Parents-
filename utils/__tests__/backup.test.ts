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

describe('Backup file checks', () => {
  beforeEach(() => { (globalThis as any).localStorage = new MemoryStorage(); });

  test('Round trip: every record comes back exactly', async () => {
    const original: Record<string, string> = {
      pedipulse_children: JSON.stringify({ activeId: 'a', children: [{ id: 'a', name: 'Mia', dob: '2025-09-15' }] }),
      'pedipulse_history:a': JSON.stringify({ allergies: ['Penicillin'], growthRecords: [{ age: 12, weight: 9.6, date: '2026-09-15' }] }),
      pedipulse_setup_skipped: 'false',
    };
    for (const [k, v] of Object.entries(original)) localStorage.setItem(k, v);
    const { backup } = await load();
    const file = await backup.createBackup('correct horse battery', undefined, 1000);
    localStorage.clear();
    await backup.restoreRecords((await backup.readBackup(file, 'correct horse battery')).records);
    expect(Object.fromEntries([...(localStorage as any).m.entries()])).toEqual(original);
  });

  test('A wrong passphrase restores nothing and changes nothing', async () => {
    localStorage.setItem('pedipulse_children', '{"original":true}');
    const { backup } = await load();
    const file = await backup.createBackup('correct horse battery', { pedipulse_children: '{"from":"backup"}' }, 1000);
    await expect(backup.readBackup(file, 'Correct horse battery')).rejects.toThrow("That password doesn't open this backup.");
    expect(localStorage.getItem('pedipulse_children')).toBe('{"original":true}');
  });

  test('An altered file is rejected (AES-GCM authentication)', async () => {
    const { backup } = await load();
    const file = JSON.parse(await backup.createBackup('long-password', { pedipulse_children: '{}' }, 1000));
    const data: string = file.data;
    const flipped = data.slice(0, -6) + (data.at(-6) === 'A' ? 'B' : 'A') + data.slice(-5);
    await expect(backup.readBackup(JSON.stringify({ ...file, data: flipped }), 'long-password')).rejects.toThrow("That password doesn't open this backup.");
  });

  test('Files that could freeze the browser or are malformed are refused before decrypting', async () => {
    const { backup } = await load();
    const file = JSON.parse(await backup.createBackup('long-password', { pedipulse_children: '{}' }, 1000));
    await expect(backup.readBackup(JSON.stringify({ ...file, iterations: 1e12 }), 'long-password')).rejects.toThrow('This backup file is damaged.');
    await expect(backup.readBackup(JSON.stringify({ ...file, iterations: 'many' }), 'long-password')).rejects.toThrow('This backup file is damaged.');
    await expect(backup.readBackup(JSON.stringify({ ...file, salt: '!!' }), 'long-password')).rejects.toThrow('This backup file is damaged.');
    await expect(backup.readBackup(' '.repeat(backup.MAX_BACKUP_BYTES + 1), 'long-password')).rejects.toThrow(/too large/);
  });

  test('Contents that are not PediPulse records are refused', async () => {
    const { backup } = await load();
    for (const bad of [['not', 'an', 'object'], { other_app: 'x' }, { pedipulse_children: 42 }]) {
      const file = await backup.createBackup('long-password', bad as any, 1000);
      await expect(backup.readBackup(file, 'long-password')).rejects.toThrow('This backup file is damaged.');
    }
  });

  test('Device-only settings are never backed up or restored', async () => {
    localStorage.setItem('pedipulse_children', '{}');
    localStorage.setItem('pedipulse_ai_consent', '{"version":"2"}');
    localStorage.setItem('pedipulse_premium_code', 'pp1.secret');
    const { backup, vault } = await load();
    const file = await backup.createBackup('long-password', undefined, 1000);
    const { records } = await backup.readBackup(file, 'long-password');
    expect(Object.keys(records)).toEqual(['pedipulse_children']);

    // A crafted or older file that carries them: they are dropped on read and on restore.
    localStorage.clear();
    const crafted = await backup.createBackup('long-password', {
      pedipulse_children: '{}', pedipulse_ai_consent: '{"version":"2"}', pedipulse_premium_code: 'pp1.x', [vault.LOCK_META_KEY]: '{"salt":"x"}',
    }, 1000);
    const read = await backup.readBackup(crafted, 'long-password');
    expect(Object.keys(read.records)).toEqual(['pedipulse_children']);
    await backup.restoreRecords({ pedipulse_children: '{}', pedipulse_ai_consent: 'yes', [vault.LOCK_META_KEY]: 'x' });
    expect(localStorage.getItem('pedipulse_ai_consent')).toBeNull();
    expect(localStorage.getItem(vault.LOCK_META_KEY)).toBeNull();
  });
});
