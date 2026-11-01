import { describe, test, expect } from 'vitest';
import {
  NIP_VISITS, NIP_SCHEDULE, nipStatuses, nextNipVisit, addMonths, toCalendarDate, syncNipRecords,
} from '../vaccineSchedule';

const iso = (d: Date) => d.toISOString().slice(0, 10);
const statusOf = (statuses: ReturnType<typeof nipStatuses>) => Object.fromEntries(statuses.map(s => [s.visit.id, s.status]));
const at = (date: string) => new Date(`${date}T10:00:00`);

describe('NIP schedule data', () => {
  test('Covers birth, 2, 4, 6, 12, 18 months, 4 years and the Year 7 and Year 10 school programs', () => {
    expect(NIP_VISITS.map(v => v.dueMonths)).toEqual([0, 2, 4, 6, 12, 18, 48, 144, 180]);
    expect(NIP_VISITS.filter(v => v.schoolProgram).map(v => v.id)).toEqual(['nip-year7', 'nip-year10']);
  });

  test('No state or territory programs are included', () => {
    const text = JSON.stringify(NIP_VISITS);
    expect(text).not.toMatch(/Meningococcal B|Queensland|South Australia|\bQLD\b|\bSA\b|\bNT\b|\bWA\b|Hepatitis A/);
  });
});

describe('Vaccine due dates', () => {
  test('Due dates come from the date of birth', () => {
    const due = NIP_SCHEDULE('2026-03-15').map(v => [v.id, iso(new Date(v.dueDate))]);
    expect(due).toEqual([
      ['nip-birth', '2026-03-15'], ['nip-2mo', '2026-05-15'], ['nip-4mo', '2026-07-15'], ['nip-6mo', '2026-09-15'],
      ['nip-12mo', '2027-03-15'], ['nip-18mo', '2027-09-15'], ['nip-4yr', '2030-03-15'],
      ['nip-year7', '2038-03-15'], ['nip-year10', '2041-03-15'],
    ]);
  });

  test('Month ends are kept in shorter months', () => {
    expect(iso(addMonths(toCalendarDate('2026-12-31')!, 2))).toBe('2027-02-28');
    expect(iso(addMonths(toCalendarDate('2027-12-31')!, 2))).toBe('2028-02-29');
    expect(iso(addMonths(toCalendarDate('2026-08-31')!, 6))).toBe('2027-02-28');
  });

  test('Time of day and time zone do not move the date', () => {
    expect(iso(toCalendarDate('2026-03-15')!)).toBe('2026-03-15');
    expect(iso(toCalendarDate(new Date(2026, 2, 15, 23, 59))!)).toBe('2026-03-15');
    expect(iso(toCalendarDate(new Date(2026, 2, 15, 0, 1))!)).toBe('2026-03-15');
  });
});

describe('Vaccine status', () => {
  const dob = '2026-03-15';

  test('Upcoming before the due date, due on it, overdue a month after', () => {
    expect(statusOf(nipStatuses(dob, [], at('2026-05-14')))['nip-2mo']).toBe('upcoming');
    expect(statusOf(nipStatuses(dob, [], at('2026-05-15')))['nip-2mo']).toBe('due');
    expect(statusOf(nipStatuses(dob, [], at('2026-06-14')))['nip-2mo']).toBe('due');
    expect(statusOf(nipStatuses(dob, [], at('2026-06-15')))['nip-2mo']).toBe('overdue');
  });

  test('The birth dose is overdue after 7 days', () => {
    expect(statusOf(nipStatuses(dob, [], at('2026-03-21')))['nip-birth']).toBe('due');
    expect(statusOf(nipStatuses(dob, [], at('2026-03-22')))['nip-birth']).toBe('overdue');
  });

  test('Recorded doses are given, whatever the date', () => {
    const recorded = [
      { id: 'nip-birth', status: 'completed' as const, receivedDate: new Date('2026-03-15') },
      { id: 'nip-2mo', status: 'completed' as const },
      { id: 'nip-4mo', status: 'pending' as const },
    ];
    const s = statusOf(nipStatuses(dob, recorded, at('2026-08-20')));
    expect(s).toMatchObject({ 'nip-birth': 'given', 'nip-2mo': 'given', 'nip-4mo': 'overdue', 'nip-6mo': 'upcoming' });
  });

  test('School programs are upcoming for a young child and only overdue two years after Year 7 age', () => {
    expect(statusOf(nipStatuses(dob, [], at('2027-01-01')))['nip-year7']).toBe('upcoming');
    expect(statusOf(nipStatuses(dob, [], at('2039-03-14')))['nip-year7']).toBe('due');
    expect(statusOf(nipStatuses(dob, [], at('2040-03-15')))['nip-year7']).toBe('overdue');
  });

  test('Next visit: the earliest overdue or due visit, else the next upcoming one', () => {
    const allEarly = [{ id: 'nip-birth', status: 'completed' as const }, { id: 'nip-2mo', status: 'completed' as const }];
    expect(nextNipVisit(nipStatuses(dob, allEarly, at('2026-06-01')))?.visit.id).toBe('nip-4mo');
    expect(iso(nextNipVisit(nipStatuses(dob, allEarly, at('2026-06-01')))!.dueDate)).toBe('2026-07-15');
    expect(nextNipVisit(nipStatuses(dob, [], at('2026-06-01')))?.visit.id).toBe('nip-birth');
    const all = NIP_VISITS.map(v => ({ id: v.id, status: 'completed' as const }));
    expect(nextNipVisit(nipStatuses(dob, all, at('2027-06-01')))).toBeNull();
  });

  test('Dates saved as strings work', () => {
    const stored = JSON.parse(JSON.stringify([{ id: 'nip-birth', status: 'completed', receivedDate: new Date('2026-03-16') }]));
    const birth = nipStatuses(dob, stored, at('2026-04-01'))[0];
    expect(birth.status).toBe('given');
    expect(iso(birth.givenDate!)).toBe('2026-03-16');
  });

  test('No date of birth, no statuses', () => {
    expect(nipStatuses('', [])).toEqual([]);
  });
});

describe('Saved records', () => {
  test('Older records gain the school programs and keep what the parent recorded', () => {
    const old = NIP_SCHEDULE('2026-03-15').slice(0, 7).map(v => ({ ...v, name: `${v.ageMilestone}-Month Milestone` }));
    old[0] = { ...old[0], status: 'completed', receivedDate: new Date('2026-03-15'), clinic: 'Local GP', lotNumber: 'AB1' };
    const custom = { id: 'flu-2026', name: 'Influenza', dueDate: new Date('2026-10-01'), status: 'completed' as const, description: 'Flu', ageMilestone: 99 };
    const synced = syncNipRecords([...old, custom], '2026-03-15');
    expect(synced.map(v => v.id)).toEqual([...NIP_VISITS.map(v => v.id), 'flu-2026']);
    expect(synced[0]).toMatchObject({ name: 'Birth', status: 'completed', clinic: 'Local GP', lotNumber: 'AB1' });
    expect(synced[1].name).toBe('2 months');
  });
});
