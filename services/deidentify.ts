import { ClinicalEvent, MedicalHistory } from '../types';

/**
 * Builds the de-identified summary that premium AI features send to
 * Anthropic. Only clinical facts go in: no name, date of birth (age is given
 * instead), contact details, care-team or family names, photos, scanned
 * letters or attachments. In free text, the child's name, names the record
 * already holds (care team, providers, family), email addresses and phone
 * numbers are replaced. Other names a parent types can't be detected, so the
 * consent dialog asks parents to leave them out.
 */
export interface SummaryInput {
  history: Partial<MedicalHistory>;
  childName?: string;
  /** e.g. "1 year, 2 months" */
  age?: string | null;
  sex?: string;
  /** Extra events the parent chose to include (from the record screen). */
  linkedEvents?: Pick<ClinicalEvent, 'source' | 'description' | 'date' | 'severity'>[];
}

const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
// Australian and international phone-number shapes (8+ digits with optional spaces, dashes or brackets).
const PHONE = /(?:\+?\d[\d\s()-]{6,}\d)/g;

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const TITLES = new Set(['dr', 'mr', 'mrs', 'ms', 'miss', 'prof', 'professor', 'nurse', 'the', 'and']);

/** Full names first, then their parts, so a full name becomes one replacement. */
const namePatterns = (names: string[]) => {
  const full = names.map(n => n.trim()).filter(n => n.length > 1);
  const parts = full.flatMap(n => n.split(/\s+/)).filter(p => p.length > 1 && !TITLES.has(p.toLowerCase().replace('.', '')));
  return [...new Set([...full, ...parts])];
};

export function scrubText(text: string | undefined, childName?: string, otherNames: string[] = []): string {
  if (!text) return '';
  let out = text.replace(EMAIL, '[email removed]').replace(PHONE, '[number removed]');
  for (const name of namePatterns(childName ? [childName] : [])) {
    out = out.replace(new RegExp(`\\b${escapeRegExp(name)}\\b`, 'gi'), 'the child');
  }
  for (const name of namePatterns(otherNames)) {
    out = out.replace(new RegExp(`\\b${escapeRegExp(name)}\\b`, 'gi'), '[name removed]');
  }
  return out.trim();
}

export function deidentifiedSummary({ history, childName, age, sex, linkedEvents }: SummaryInput) {
  // People the record already names: care team, appointment providers and family.
  const otherNames = [
    ...(history.specialists || []).map(p => p.name),
    ...(history.appointments || []).map(a => a.provider),
    ...(history.familyHistory?.members || []).map(m => (m as { name?: string }).name),
  ].filter((n): n is string => typeof n === 'string');
  const scrub = (t?: string) => scrubText(t, childName, otherNames);
  const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
  return {
    child: { age: age || 'not recorded', sex: sex || 'not recorded' },
    allergies: (history.allergies || []).map(scrub),
    conditions: (history.conditions || []).map(c => ({ name: scrub(c.name), status: c.status })),
    currentMedicines: (history.currentMedications || []).map(m => ({ name: scrub(m.name), dose: scrub(m.dose), reason: scrub(m.indication) })),
    pastMedicalHistory: scrub(history.pastMedicalHistory),
    surgicalHistory: scrub(history.surgicalHistory),
    growth: (history.growthRecords || []).slice(-3).map(g => ({
      ageMonths: g.age, weightKg: g.weight, lengthCm: g.height, headCm: g.headCircumference,
    })),
    vaccinesRecordedAsGiven: (history.vaccinations || []).filter(v => v.status === 'completed').map(v => v.name),
    recentLog: (history.acuteLogs || [])
      .filter(l => new Date(l.timestamp).getTime() >= cutoff)
      .slice(0, 15)
      .map(l => ({ when: l.timestamp, type: l.type, medicine: l.medicationName, value: scrub(l.value), notes: scrub(l.notes) })),
    parentAddedEvents: (linkedEvents || []).map(e => ({ source: e.source, details: scrub(e.description), date: e.date, severity: e.severity })),
  };
}
