
/**
 * PEDIATRIC DOSING SAFETY CONSTANTS (Australian Standards - RCH/AMH)
 */
export const DOSING_GUIDELINES = {
  PARACETAMOL: {
    MG_PER_KG: 15,
    MAX_SINGLE_MG: 1000,
    MAX_DAILY_DOSES: 4,
    MIN_INTERVAL_HOURS: 4,
  },
  IBUPROFEN: {
    MG_PER_KG: 10,
    MAX_SINGLE_MG: 400,
    MAX_DAILY_DOSES: 3,
    MIN_INTERVAL_HOURS: 6,
  }
};

export interface SafeDoseResult {
  medication: string;
  mgPerDose: number;
  maxDosesPerDay: number;
  intervalHours: number;
  safetyWarnings: string[];
}

/**
 * Calculates a conservative safety ceiling for common OTC medications.
 * Explicitly handles hard caps for children approaching adult weights.
 */
export function calculateSafetyCeiling(weightKg: number, medication: string): SafeDoseResult | null {
  // Hard Unit Check
  if (weightKg > 150) return null; // Likely unit error
  if (weightKg < 2) return null; // Below safe threshold for app calculator

  const normalizedMed = medication.toLowerCase();
  
  if (normalizedMed.includes('paracetamol')) {
    const mg = Math.min(weightKg * DOSING_GUIDELINES.PARACETAMOL.MG_PER_KG, DOSING_GUIDELINES.PARACETAMOL.MAX_SINGLE_MG);
    return {
      medication: 'Paracetamol',
      mgPerDose: Math.floor(mg),
      maxDosesPerDay: DOSING_GUIDELINES.PARACETAMOL.MAX_DAILY_DOSES,
      intervalHours: DOSING_GUIDELINES.PARACETAMOL.MIN_INTERVAL_HOURS,
      safetyWarnings: [
        "Do not exceed 4 doses in any 24-hour period.",
        "Ensure at least 4 hours between doses.",
        "Check other medicines to ensure no paracetamol duplication."
      ]
    };
  }

  if (normalizedMed.includes('ibuprofen')) {
    const mg = Math.min(weightKg * DOSING_GUIDELINES.IBUPROFEN.MG_PER_KG, DOSING_GUIDELINES.IBUPROFEN.MAX_SINGLE_MG);
    return {
      medication: 'Ibuprofen',
      mgPerDose: Math.floor(mg),
      maxDosesPerDay: DOSING_GUIDELINES.IBUPROFEN.MAX_DAILY_DOSES,
      intervalHours: DOSING_GUIDELINES.IBUPROFEN.MIN_INTERVAL_HOURS,
      safetyWarnings: [
        "Give with or after food to protect the stomach.",
        "Ensure at least 6 hours between doses.",
        "Avoid use in dehydrated children."
      ]
    };
  }

  return null;
}
