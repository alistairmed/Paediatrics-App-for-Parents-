import { WHO_GROWTH, LmsRow, WhoTables } from './whoGrowthData';

export type GrowthMeasure = keyof WhoTables; // 'weight' | 'length' | 'head'
export type GrowthSex = 'male' | 'female';

export const WHO_MAX_MONTHS = 60;

/** z-scores of the percentile lines shown on charts (as in the Red Book). */
export const PERCENTILE_LINES = [
  { label: '3rd', z: -1.881 },
  { label: '15th', z: -1.036 },
  { label: '50th', z: 0 },
  { label: '85th', z: 1.036 },
  { label: '97th', z: 1.881 },
];

/** LMS at an age in months (0-60), interpolating between whole months. */
export function lmsAt(sex: GrowthSex, measure: GrowthMeasure, ageMonths: number): LmsRow | null {
  if (!(ageMonths >= 0 && ageMonths <= WHO_MAX_MONTHS)) return null;
  const rows = WHO_GROWTH[sex][measure];
  const i = Math.floor(ageMonths);
  const j = Math.min(i + 1, rows.length - 1);
  const f = ageMonths - i;
  return [0, 1, 2].map(k => rows[i][k] + (rows[j][k] - rows[i][k]) * f) as LmsRow;
}

export function valueAtZ([L, M, S]: LmsRow, z: number): number {
  return L === 0 ? M * Math.exp(S * z) : M * Math.pow(1 + L * S * z, 1 / L);
}

export function zScore([L, M, S]: LmsRow, value: number): number {
  return L === 0 ? Math.log(value / M) / S : (Math.pow(value / M, L) - 1) / (L * S);
}

/** Standard normal cumulative distribution (Abramowitz-Stegun 7.1.26, error < 1.5e-7). */
export function normalCdf(z: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(z * z) / 2);
  return z >= 0 ? (1 + y) / 2 : (1 - y) / 2;
}

/** Percentile (0-100) of a measurement, or null outside 0-5 years. */
export function growthPercentile(sex: GrowthSex, measure: GrowthMeasure, ageMonths: number, value: number): number | null {
  const lms = lmsAt(sex, measure, ageMonths);
  if (!lms || !(value > 0)) return null;
  return normalCdf(zScore(lms, value)) * 100;
}

/** "62nd", "3rd", "below the 1st", "above the 99th" */
export function describePercentile(p: number): string {
  if (p < 1) return 'below the 1st';
  if (p > 99) return 'above the 99th';
  const n = Math.round(p);
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] || 'th';
  return `${n}${suffix}`;
}

/** Whole months between birth and a measurement date (fractional). */
export function ageInMonthsAt(dob: string, date: string): number | null {
  const b = new Date(dob).getTime(), d = new Date(date).getTime();
  if (isNaN(b) || isNaN(d) || d < b) return null;
  return (d - b) / (30.4375 * 24 * 60 * 60 * 1000);
}
