import { Vaccination } from '../types';

/**
 * Australian National Immunisation Program (NIP) schedule for children, as
 * local data. Only the routine schedule for all children is included: no
 * state or territory programs, and no extra doses for Aboriginal and Torres
 * Strait Islander children or children with medical risk conditions (see
 * NIP_EXTRAS_NOTE). Source: health.gov.au, National Immunisation Program
 * Schedule. Check it against the current schedule when it changes.
 */
export interface NipVisit {
  /** Stable id, also used for saved records ("nip-2mo"). */
  id: string;
  /** "2 months", "Year 7 (school program)" */
  name: string;
  vaccines: string[];
  /** Age the visit is due, in months from birth. */
  dueMonths: number;
  /** How long after the due date a visit counts as overdue. */
  overdueAfter: { days?: number; months?: number };
  /** Given through school rather than by age; dates are approximate. */
  schoolProgram?: boolean;
  note?: string;
}

const SIX_IN_ONE = 'Diphtheria, tetanus, whooping cough, hepatitis B, polio and Hib (6-in-1)';

export const NIP_VISITS: NipVisit[] = [
  {
    id: 'nip-birth', name: 'Birth', dueMonths: 0, overdueAfter: { days: 7 },
    vaccines: ['Hepatitis B'],
    note: 'Best given within 24 hours of birth, and within 7 days.',
  },
  {
    id: 'nip-2mo', name: '2 months', dueMonths: 2, overdueAfter: { months: 1 },
    vaccines: [SIX_IN_ONE, 'Pneumococcal', 'Rotavirus (oral)'],
    note: 'Can be given from 6 weeks. Rotavirus has upper age limits, so ask your provider if this visit is late.',
  },
  {
    id: 'nip-4mo', name: '4 months', dueMonths: 4, overdueAfter: { months: 1 },
    vaccines: [SIX_IN_ONE, 'Pneumococcal', 'Rotavirus (oral)'],
    note: 'Rotavirus has upper age limits, so ask your provider if this visit is late.',
  },
  {
    id: 'nip-6mo', name: '6 months', dueMonths: 6, overdueAfter: { months: 1 },
    vaccines: [SIX_IN_ONE],
  },
  {
    id: 'nip-12mo', name: '12 months', dueMonths: 12, overdueAfter: { months: 1 },
    vaccines: ['Measles, mumps and rubella (MMR)', 'Meningococcal ACWY', 'Pneumococcal'],
  },
  {
    id: 'nip-18mo', name: '18 months', dueMonths: 18, overdueAfter: { months: 1 },
    vaccines: ['Measles, mumps, rubella and chickenpox (MMRV)', 'Diphtheria, tetanus and whooping cough (DTPa)', 'Hib'],
  },
  {
    id: 'nip-4yr', name: '4 years', dueMonths: 48, overdueAfter: { months: 2 },
    vaccines: ['Diphtheria, tetanus, whooping cough and polio (DTPa-IPV)'],
  },
  {
    id: 'nip-year7', name: 'Year 7 (school program)', dueMonths: 12 * 12, overdueAfter: { months: 24 }, schoolProgram: true,
    vaccines: ['Human papillomavirus (HPV)', 'Diphtheria, tetanus and whooping cough (dTpa)'],
    note: 'Usually given at school in Year 7 (about 12 to 13 years). Missed doses can be caught up with your GP.',
  },
  {
    id: 'nip-year10', name: 'Year 10 (school program)', dueMonths: 15 * 12, overdueAfter: { months: 24 }, schoolProgram: true,
    vaccines: ['Meningococcal ACWY'],
    note: 'Usually given at school in Year 10 (about 15 to 16 years). Missed doses can be caught up with your GP.',
  },
];

export const NIP_FOOTNOTE = 'Based on the NIP schedule. Confirm with your GP or the Australian Immunisation Register.';

export const NIP_EXTRAS_NOTE =
  'Some children can get extra free vaccines, including Aboriginal and Torres Strait Islander children and children with some medical conditions, ' +
  'and the flu vaccine is free every year for children from 6 months to under 5 years. Ask your GP or immunisation provider.';

// ---- Dates (calendar dates in UTC, so time zones and daylight saving don't shift a day) ----

/** A date of birth or record date as a UTC calendar date, or null if invalid. */
export function toCalendarDate(value: string | Date): Date | null {
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()));
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return toCalendarDate(new Date(value));
}

/** Adds months, keeping to the last day of a shorter month (31 Jan + 1 month = 28/29 Feb). */
export function addMonths(date: Date, months: number): Date {
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(date.getUTCDate(), lastDay));
  return target;
}

/** Formats a calendar date from this module, e.g. "15 May 2026". */
export const formatNipDate = (date: Date) =>
  date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

// ---- Status ----

export type NipStatus = 'given' | 'due' | 'upcoming' | 'overdue';

export interface NipVisitStatus {
  visit: NipVisit;
  dueDate: Date;
  /** First day the visit counts as overdue. */
  overdueFrom: Date;
  status: NipStatus;
  givenDate?: Date;
}

export const NIP_STATUS_LABEL: Record<NipStatus, string> = {
  given: 'Given',
  due: 'Due now',
  upcoming: 'Upcoming',
  overdue: 'Overdue',
};

/**
 * Status of each NIP visit for a child, from the date of birth and the doses
 * recorded as given (by visit id). Upcoming: before the due date. Due: from
 * the due date until it counts as overdue. Overdue: not recorded by then.
 */
export function nipStatuses(
  dob: string | Date,
  recorded: Pick<Vaccination, 'id' | 'status' | 'receivedDate'>[] = [],
  now: Date = new Date(),
): NipVisitStatus[] {
  const birth = toCalendarDate(dob);
  const today = toCalendarDate(now);
  if (!birth || !today) return [];
  const given = new Map(recorded.filter(r => r.status === 'completed').map(r => [r.id, r]));

  return NIP_VISITS.map(visit => {
    const dueDate = addMonths(birth, visit.dueMonths);
    const overdueFrom = addDays(addMonths(dueDate, visit.overdueAfter.months || 0), visit.overdueAfter.days || 0);
    const record = given.get(visit.id);
    const status: NipStatus = record ? 'given' : today < dueDate ? 'upcoming' : today < overdueFrom ? 'due' : 'overdue';
    const givenDate = record?.receivedDate ? toCalendarDate(record.receivedDate as Date | string) ?? undefined : undefined;
    return { visit, dueDate, overdueFrom, status, givenDate };
  });
}

/**
 * The next visit to act on: the earliest overdue or due visit, otherwise the
 * next upcoming one. Null when everything is recorded as given.
 */
export function nextNipVisit(statuses: NipVisitStatus[]): NipVisitStatus | null {
  const open = statuses.filter(s => s.status !== 'given').sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  return open.find(s => s.status === 'overdue' || s.status === 'due') ?? open[0] ?? null;
}

// ---- Saved records ----

const toRecord = (visit: NipVisit, dob: Date): Vaccination => ({
  id: visit.id,
  name: visit.name,
  dueDate: addMonths(dob, visit.dueMonths),
  status: 'pending',
  description: visit.vaccines.join('; '),
  ageMilestone: visit.dueMonths,
});

/** A fresh set of records for a child, one per NIP visit. */
export const NIP_SCHEDULE = (dob: string | Date): Vaccination[] => {
  const birth = toCalendarDate(dob);
  return birth ? NIP_VISITS.map(visit => toRecord(visit, birth)) : [];
};

/**
 * Brings saved records up to date with NIP_VISITS: adds missing visits (such
 * as the school programs), refreshes names, vaccines and due dates, and keeps
 * everything the parent recorded (given, date, clinic, batch, reactions) and
 * any other vaccines they added.
 */
export function syncNipRecords(saved: Vaccination[], dob: string | Date): Vaccination[] {
  const birth = toCalendarDate(dob);
  if (!birth) return saved;
  const byId = new Map(saved.map(v => [v.id, v]));
  const nip = NIP_VISITS.map(visit => {
    const fresh = toRecord(visit, birth);
    const old = byId.get(visit.id);
    return old ? { ...old, name: fresh.name, description: fresh.description, dueDate: fresh.dueDate, ageMilestone: fresh.ageMilestone } : fresh;
  });
  const nipIds = new Set(NIP_VISITS.map(v => v.id));
  return [...nip, ...saved.filter(v => !nipIds.has(v.id))];
}
