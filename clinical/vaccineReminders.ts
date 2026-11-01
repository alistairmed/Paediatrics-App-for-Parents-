import { NipVisitStatus } from './vaccineSchedule';

/** A reminder to schedule as a local notification on the phone. */
export interface PlannedReminder {
  id: number;
  at: Date;
  title: string;
  body: string;
}

/** How many upcoming visits to schedule at once (the list is refreshed whenever records change). */
export const MAX_REMINDERS = 3;
/** Local time on the due date when the reminder appears. */
export const REMINDER_HOUR = 9;

/** A stable 31-bit id for a child's visit, so rescheduling replaces rather than duplicates. */
export function reminderId(childId: string, visitId: string): number {
  let h = 2166136261;
  for (const ch of `${childId}|${visitId}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return (h >>> 1) || 1;
}

/**
 * Reminders for the next upcoming NIP visits (not school programs, whose dates
 * are approximate), at 9am local time on the due date. The text names the visit
 * only, never the child, because notifications can show on a locked screen.
 */
export function planVaccineReminders(childId: string, statuses: NipVisitStatus[], now = new Date()): PlannedReminder[] {
  return statuses
    .filter(s => s.status === 'upcoming' && !s.visit.schoolProgram)
    .map(s => ({
      s,
      at: new Date(s.dueDate.getUTCFullYear(), s.dueDate.getUTCMonth(), s.dueDate.getUTCDate(), REMINDER_HOUR, 0, 0),
    }))
    .filter(({ at }) => at > now)
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .slice(0, MAX_REMINDERS)
    .map(({ s, at }) => ({
      id: reminderId(childId, s.visit.id),
      at,
      title: 'Vaccines due',
      body: `The ${s.visit.name} vaccines are due today. Book with your GP or immunisation provider, or record them in Paeds Pouch if they're done.`,
    }));
}
