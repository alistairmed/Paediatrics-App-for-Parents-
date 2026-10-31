/**
 * Timing reminders for a parent's own medicine log, using the general maximums
 * on most paracetamol and ibuprofen labels (RCH pain-relief fact sheet).
 * This never suggests a dose amount: that depends on weight and product.
 */
export const MEDICINE_RULES = {
  Paracetamol: { minHoursApart: 4, maxPer24Hours: 4 },
  Ibuprofen: { minHoursApart: 6, maxPer24Hours: 3 },
} as const;

export type TimedMedicine = keyof typeof MEDICINE_RULES;
export const TIMED_MEDICINES = Object.keys(MEDICINE_RULES) as TimedMedicine[];

const HOUR = 60 * 60 * 1000;

export interface MedicineStatus {
  dosesInLast24Hours: number;
  maxPer24Hours: number;
  lastGiven: Date | null;
  /** When the label limits next allow another dose; null if allowed now. */
  nextAllowedAt: Date | null;
}

export function medicineStatus(medicine: TimedMedicine, givenAt: Date[], now = new Date()): MedicineStatus {
  const { minHoursApart, maxPer24Hours } = MEDICINE_RULES[medicine];
  const past = givenAt.filter(d => !isNaN(d.getTime()) && d <= now).sort((a, b) => a.getTime() - b.getTime());
  const window = past.filter(d => now.getTime() - d.getTime() < 24 * HOUR);
  const lastGiven = past.length ? past[past.length - 1] : null;

  let next = 0;
  if (lastGiven) next = lastGiven.getTime() + minHoursApart * HOUR;
  if (window.length >= maxPer24Hours) {
    // A dose is allowed once enough of the last 24 hours' doses have dropped out of the window.
    next = Math.max(next, window[window.length - maxPer24Hours].getTime() + 24 * HOUR);
  }
  return {
    dosesInLast24Hours: window.length,
    maxPer24Hours,
    lastGiven,
    nextAllowedAt: next > now.getTime() ? new Date(next) : null,
  };
}
