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

const load = async () => { vi.resetModules(); return import('../children'); };
const profile = (name: string) => ({ name, dob: '2023-01-01', sex: 'Female' as const, medications: [], previousMedications: [], allergies: [] });

describe('Children storage', () => {
  beforeEach(() => { (globalThis as any).localStorage = new MemoryStorage(); });

  test('Moves an existing single-child profile and history, dropping account fields', async () => {
    localStorage.setItem('pedipulse_profile', JSON.stringify({ ...profile('Mia'), email: 'a@b.c', password: 'secret' }));
    localStorage.setItem('pedipulse_history', '{"pastMedicalHistory":"Asthma"}');
    const c = await load();
    c.migrateLegacyRecords(() => 'id1');
    const state = JSON.parse(localStorage.getItem(c.CHILDREN_KEY)!);
    expect(state.activeId).toBe('id1');
    expect(state.children[0].name).toBe('Mia');
    expect(state.children[0]).not.toHaveProperty('password');
    expect(state.children[0]).not.toHaveProperty('email');
    expect(localStorage.getItem(c.historyKey('id1'))).toBe('{"pastMedicalHistory":"Asthma"}');
    expect(localStorage.getItem('pedipulse_profile')).toBeNull();
    expect(localStorage.getItem('pedipulse_history')).toBeNull();
    c.migrateLegacyRecords(() => 'id2'); // runs once only
    expect(JSON.parse(localStorage.getItem(c.CHILDREN_KEY)!).activeId).toBe('id1');
  });

  test('History recorded before any profile goes to the first child added', async () => {
    localStorage.setItem('pedipulse_history', '{"acuteLogs":[1]}');
    const c = await load();
    c.migrateLegacyRecords();
    expect(localStorage.getItem(c.historyKey(c.GUEST_ID))).toBe('{"acuteLogs":[1]}');
    const s1 = c.addChild(c.EMPTY_CHILDREN, profile('Tom'), 'kid1');
    expect(localStorage.getItem(c.historyKey('kid1'))).toBe('{"acuteLogs":[1]}');
    expect(localStorage.getItem(c.historyKey(c.GUEST_ID))).toBeNull();
    const s2 = c.addChild(s1, profile('Ava'), 'kid2');
    expect(s2.activeId).toBe('kid2');
    expect(localStorage.getItem(c.historyKey('kid2'))).toBeNull();
  });

  test('Removing a child deletes their history and picks another active child', async () => {
    const c = await load();
    let s = c.addChild(c.EMPTY_CHILDREN, profile('Tom'), 'kid1');
    s = c.addChild(s, profile('Ava'), 'kid2');
    localStorage.setItem(c.historyKey('kid2'), '{}');
    s = c.removeChild(s, 'kid2');
    expect(s.children.map(x => x.name)).toEqual(['Tom']);
    expect(s.activeId).toBe('kid1');
    expect(localStorage.getItem(c.historyKey('kid2'))).toBeNull();
    s = c.updateChild(s, 'kid1', profile('Thomas'));
    expect(s.children[0].name).toBe('Thomas');
  });
});

describe('Age description', () => {
  test('Counts whole months, with correct plurals', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-10T12:00:00'));
    const { describeAge } = await import('../ChildProfileContext');
    expect(describeAge('2026-09-15')).toBe('0 months old');
    expect(describeAge('2026-09-10')).toBe('1 month old');
    expect(describeAge('2025-09-15')).toBe('1 year, 0 months');
    expect(describeAge('2024-08-01')).toBe('2 years, 2 months');
    vi.useRealTimers();
  });
});
