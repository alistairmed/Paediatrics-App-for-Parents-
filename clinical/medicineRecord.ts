/**
 * A factual summary of the doses a parent has recorded. It holds no dosing
 * rules: how much and how often to give comes from the label or a pharmacist.
 */
export const LOGGED_MEDICINES = ['Paracetamol', 'Ibuprofen'] as const;
export type LoggedMedicine = typeof LOGGED_MEDICINES[number];

const DAY = 24 * 60 * 60 * 1000;

export interface MedicineSummary {
  lastGiven: Date | null;
  /** Doses recorded in the 24 hours before `now`. */
  dosesInLast24Hours: number;
}

export function medicineSummary(givenAt: Date[], now = new Date()): MedicineSummary {
  const past = givenAt.filter(d => !isNaN(d.getTime()) && d <= now).sort((a, b) => a.getTime() - b.getTime());
  return {
    lastGiven: past.length ? past[past.length - 1] : null,
    dosesInLast24Hours: past.filter(d => now.getTime() - d.getTime() < DAY).length,
  };
}
