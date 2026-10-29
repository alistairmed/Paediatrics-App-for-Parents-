import { MedicalHistory, SickDayPlan, DevelopmentalHistory, FamilyHistory } from '../types';

const DEFAULT_SICK_DAY: SickDayPlan = {
  greenZone: '',
  yellowZone: '',
  redZone: '',
  backgroundForED: '',
  emergencyMeds: '',
  fluidRequirements: '',
  triggers: '',
  emergencyContact: '',
  ambulanceTriggers: '',
  dangerSigns: '',
  carerActions: '',
  planPhoto: undefined
};

const DEFAULT_DEV_HISTORY: DevelopmentalHistory = {
  prenatal: { complications: '', scansNormal: true, medications: '' },
  perinatal: { gestation: '', deliveryType: '', birthWeight: '', apgars: '' },
  neonatal: { nicuStay: false, jaundice: false, feedingIssues: '', earlyConcerns: '' }
};

const DEFAULT_FAMILY_HISTORY: FamilyHistory = {
  maternal: '',
  paternal: '',
  siblings: '',
  other: '',
  members: []
};

export const DEFAULT_HISTORY: MedicalHistory = {
  pastMedicalHistory: '',
  surgicalHistory: '',
  bondingNotes: '',
  consultationNotes: '',
  currentMedications: [],
  previousMedications: [],
  allergies: [],
  familyHistory: DEFAULT_FAMILY_HISTORY,
  developmentalHistory: DEFAULT_DEV_HISTORY,
  specialists: [],
  appointments: [],
  devices: [],
  sickDayPlan: DEFAULT_SICK_DAY,
  activeRecommendations: [],
  medicalReports: [],
  conditions: [],
  vaccinations: [],
  growthRecords: [],
  milestones: [],
  acuteLogs: [],
  investigations: []
};

const isObject = (v: unknown): v is Record<string, any> => typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * Fills in anything missing from saved history (for example, data saved by an
 * older version of the app), so screens can rely on every field existing.
 * Saved values always win; only missing or wrongly-typed fields get defaults.
 */
export function withHistoryDefaults(stored: unknown): MedicalHistory {
  const saved = isObject(stored) ? stored : {};
  const merged: Record<string, any> = { ...DEFAULT_HISTORY, ...saved };

  for (const [key, fallback] of Object.entries(DEFAULT_HISTORY)) {
    const value = saved[key];
    if (Array.isArray(fallback)) {
      merged[key] = Array.isArray(value) ? value : fallback;
    } else if (isObject(fallback)) {
      const obj = isObject(value) ? value : {};
      merged[key] = { ...fallback, ...obj };
      // One level deeper, e.g. developmentalHistory.prenatal
      for (const [subKey, subFallback] of Object.entries(fallback)) {
        if (isObject(subFallback)) merged[key][subKey] = { ...subFallback, ...(isObject(obj[subKey]) ? obj[subKey] : {}) };
        if (Array.isArray(subFallback) && !Array.isArray(obj[subKey])) merged[key][subKey] = subFallback;
      }
    } else if (typeof value !== typeof fallback && value !== undefined && fallback !== undefined) {
      merged[key] = fallback;
    }
  }
  return merged as MedicalHistory;
}
