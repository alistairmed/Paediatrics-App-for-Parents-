/**
 * Whole months between a date of birth and now (or a given date).
 * Returns undefined when the date of birth is missing or invalid.
 */
export function ageInMonths(dob?: string, now: Date = new Date()): number | undefined {
  if (!dob) return undefined;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return undefined;
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) months--;
  return months;
}
