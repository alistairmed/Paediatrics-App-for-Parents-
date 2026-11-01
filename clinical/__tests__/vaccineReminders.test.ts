import { describe, test, expect } from 'vitest';
import { planVaccineReminders, reminderId, MAX_REMINDERS } from '../vaccineReminders';
import { nipStatuses } from '../vaccineSchedule';

describe('Vaccine reminders (local notifications)', () => {
  const now = new Date('2026-04-01T12:00:00');
  const statuses = nipStatuses('2026-03-15', [{ id: 'nip-birth', status: 'completed' }], now);

  test('Schedules the next upcoming visits at 9am local time on the due date', () => {
    const plan = planVaccineReminders('child-1', statuses, now);
    expect(plan).toHaveLength(MAX_REMINDERS);
    expect(plan[0].at).toEqual(new Date(2026, 4, 15, 9, 0, 0)); // 2 months: 15 May 2026
    expect(plan.map(r => r.body.match(/The (.*) vaccines/)![1])).toEqual(['2 months', '4 months', '6 months']);
  });

  test("Never names the child (notifications can show on a locked screen)", () => {
    for (const r of planVaccineReminders('child-1', statuses, now)) {
      expect(`${r.title} ${r.body}`).not.toMatch(/child-1|Mia/);
    }
  });

  test('Skips given, due, overdue and school-program visits', () => {
    const later = new Date('2027-05-01T12:00:00');
    const plan = planVaccineReminders('child-1', nipStatuses('2026-03-15', [], later), later);
    expect(plan.map(r => r.body.match(/The (.*) vaccines/)![1])).toEqual(['18 months', '4 years']);
  });

  test('Ids are stable per child and visit, and differ between children', () => {
    expect(reminderId('a', 'nip-2mo')).toBe(reminderId('a', 'nip-2mo'));
    expect(reminderId('a', 'nip-2mo')).not.toBe(reminderId('b', 'nip-2mo'));
    expect(reminderId('a', 'nip-2mo')).toBeGreaterThan(0);
    expect(reminderId('a', 'nip-2mo')).toBeLessThan(2 ** 31);
  });
});
