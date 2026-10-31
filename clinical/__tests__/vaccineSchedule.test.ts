import { describe, test, expect } from 'vitest';
import { NIP_SCHEDULE, vaccineReminders } from '../vaccineSchedule';

describe('Vaccine reminders', () => {
  const dob = new Date('2026-08-01T00:00:00');
  const schedule = NIP_SCHEDULE(dob);

  test('A 2-month-old: birth dose overdue, 2-month dose due soon', () => {
    const now = new Date('2026-09-15T00:00:00');
    const r = vaccineReminders(schedule, now);
    expect(r.overdue.map(v => v.id)).toEqual(['nip-birth']);
    expect(r.dueSoon.map(v => v.id)).toEqual(['nip-2mo']);
  });

  test('Completed vaccines are never reminded', () => {
    const now = new Date('2026-10-05T00:00:00');
    const done = schedule.map(v => (v.id === 'nip-birth' || v.id === 'nip-2mo' ? { ...v, status: 'completed' as const } : v));
    const r = vaccineReminders(done, now);
    expect(r.overdue).toEqual([]);
    expect(r.dueSoon).toEqual([]);
  });

  test('Works with dates stored as strings', () => {
    const stored = JSON.parse(JSON.stringify(schedule));
    const r = vaccineReminders(stored, new Date('2026-11-25T00:00:00'));
    expect(r.overdue.map(v => v.id)).toEqual(['nip-birth', 'nip-2mo']);
    expect(r.dueSoon.map(v => v.id)).toEqual(['nip-4mo']);
  });
});
