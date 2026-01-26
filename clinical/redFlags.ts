
import { EnvironmentMode } from "../types";

export type RedFlagSeverity = 'Urgent' | 'Moderate';

export interface RedFlag {
  id: string;
  message: string;
  subtext: string;
  severity: RedFlagSeverity;
}

export interface ClinicalInput {
  ageMonths?: number;
  temperature?: number;
  symptoms: string[];
  durationDays?: number;
  environment?: EnvironmentMode;
}

/**
 * Evaluates clinical inputs against standard pediatric safety rules.
 * Incorporates WHO IMCI (Integrated Management of Childhood Illness) danger signs.
 * This acts as a deterministic safety layer.
 */
export function evaluateRedFlags(input: ClinicalInput): RedFlag[] {
  const flags: RedFlag[] = [];
  const isLowResource = input.environment === 'low-resource';
  const symptomString = input.symptoms.join(' ').toLowerCase();

  // --- 1. WHO IMCI GENERAL DANGER SIGNS (Always Checked) ---
  // These are high-specificity indicators for severe systemic illness.

  // IMCI: Unable to drink or breastfeed
  if (['not drinking', 'unable to drink', 'cannot drink', 'refusing breast', 'wont drink'].some(kw => symptomString.includes(kw))) {
    flags.push({
      id: 'imci-not-drinking',
      message: 'Urgent Danger Sign: Unable to Drink',
      subtext: 'The child is unable to drink or breastfeed, indicating a critical systemic illness or severe dehydration.',
      severity: 'Urgent'
    });
  }

  // IMCI: Vomits everything
  if (['vomits everything', 'persistent vomiting', 'cannot keep anything down', 'projectile vomiting'].some(kw => symptomString.includes(kw))) {
    flags.push({
      id: 'imci-vomiting',
      message: 'Urgent Danger Sign: Persistent Vomiting',
      subtext: 'Vomiting everything is a critical indicator of severe disease or obstruction in children.',
      severity: 'Urgent'
    });
  }

  // IMCI: Convulsions (Fits)
  if (['convulsions', 'fit', 'seizure', 'shaking uncontrollably', 'twitching'].some(kw => symptomString.includes(kw))) {
    flags.push({
      id: 'imci-convulsions',
      message: 'Urgent Danger Sign: Convulsions',
      subtext: 'A convulsion (fit) during this illness is a critical neurological indicator requiring immediate review.',
      severity: 'Urgent'
    });
  }

  // --- 2. STANDARD CLINICAL RED FLAGS ---

  // Neonatal Fever Rule (Critical)
  if (input.ageMonths !== undefined && input.ageMonths < 3 && input.temperature && input.temperature >= 38) {
    flags.push({
      id: 'neonate-fever',
      message: 'Urgent Medical Review Required',
      subtext: 'Fever ≥38°C in an infant under 3 months is a medical emergency until proven otherwise.',
      severity: 'Urgent'
    });
  }

  // Respiratory Distress Logic
  const respDistressKeywords = ['difficulty breathing', 'grunting', 'wheezing', 'chest sucking', 'fast breathing', 'stridor', 'noisy breathing', 'retractions'];
  const hasRespDistress = respDistressKeywords.some(keyword => symptomString.includes(keyword));

  if (hasRespDistress) {
    flags.push({
      id: 'resp-distress',
      message: 'Respiratory Distress Detected',
      subtext: 'Signs of increased work of breathing (grunting, wheezing, or chest retractions) require immediate professional assessment.',
      severity: 'Urgent'
    });
  }

  // Altered Consciousness / Lethargy
  const lethargyKeywords = ['floppy', 'lethargic', 'unresponsive', 'wont wake', 'unusually sleepy', 'very drowsy', 'unconscious'];
  if (lethargyKeywords.some(kw => symptomString.includes(kw))) {
    flags.push({
      id: 'altered-consciousness',
      message: 'Decreased Level of Consciousness',
      subtext: 'If your child is unusually floppy, lethargic, or difficult to wake, seek emergency care immediately.',
      severity: 'Urgent'
    });
  }

  // Dehydration Signs
  const dehydrationKeywords = ['no wet nappy', 'dry mouth', 'crying without tears', 'sunken eyes', 'not peeing'];
  if (dehydrationKeywords.some(kw => symptomString.includes(kw))) {
    flags.push({
      id: 'dehydration',
      message: 'Signs of Dehydration',
      subtext: 'Reduced urine output or dry mucous membranes in an unwell child warrant clinical review.',
      severity: 'Urgent'
    });
  }

  // Prolonged Illness - Conservative Threshold in Low-Resource
  const durationThreshold = isLowResource ? 3 : 5;
  if (input.durationDays && input.durationDays > durationThreshold) {
    flags.push({
      id: 'prolonged-illness',
      message: isLowResource ? 'Early Escalation Recommended' : 'Persistent Symptoms',
      subtext: isLowResource 
        ? `In settings with limited resources, symptoms exceeding ${durationThreshold} days warrant earlier professional review.`
        : `Symptoms lasting more than ${durationThreshold} days should be reviewed by a GP even if mild.`,
      severity: isLowResource ? 'Urgent' : 'Moderate'
    });
  }

  // Very High Fever
  if (input.temperature && input.temperature >= 40) {
    flags.push({
      id: 'high-fever',
      message: 'High Pyrexia (≥40°C)',
      subtext: 'High fever requires immediate medical assessment to determine the underlying cause and assess for serious infection.',
      severity: 'Urgent'
    });
  }

  return flags;
}
