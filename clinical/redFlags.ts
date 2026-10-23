
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
 * Lowercases free text and strips apostrophes so "won't" and "wont" match the same keywords.
 */
function normaliseSymptoms(symptoms: string[]): string {
  return symptoms.join(' ').toLowerCase().replace(/['\u2019\u2018`]/g, '');
}

/**
 * True when any keyword appears as whole words, so "fit" matches "had a fit" but not "outfit".
 */
function mentions(text: string, keywords: string[]): boolean {
  return keywords.some(kw => new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(text));
}

/**
 * Evaluates clinical inputs against standard pediatric safety rules.
 * Incorporates WHO IMCI (Integrated Management of Childhood Illness) danger signs.
 * This acts as a deterministic safety layer.
 */
export function evaluateRedFlags(input: ClinicalInput): RedFlag[] {
  const flags: RedFlag[] = [];
  const isLowResource = input.environment === 'low-resource';
  const symptomString = normaliseSymptoms(input.symptoms);

  // --- 1. WHO IMCI GENERAL DANGER SIGNS (Always Checked) ---
  // These are high-specificity indicators for severe systemic illness.

  // IMCI: Unable to drink or breastfeed
  if (mentions(symptomString, ['not drinking', 'unable to drink', 'cannot drink', 'cant drink', 'refusing breast', 'wont drink', 'refusing feeds', 'not feeding'])) {
    flags.push({
      id: 'imci-not-drinking',
      message: 'Urgent Danger Sign: Unable to Drink',
      subtext: 'The child is unable to drink or breastfeed, indicating a critical systemic illness or severe dehydration.',
      severity: 'Urgent'
    });
  }

  // IMCI: Vomits everything
  if (mentions(symptomString, ['vomits everything', 'persistent vomiting', 'cannot keep anything down', 'projectile vomiting'])) {
    flags.push({
      id: 'imci-vomiting',
      message: 'Urgent Danger Sign: Persistent Vomiting',
      subtext: 'Vomiting everything is a critical indicator of severe disease or obstruction in children.',
      severity: 'Urgent'
    });
  }

  // IMCI: Convulsions (Fits)
  if (mentions(symptomString, ['convulsions', 'convulsion', 'fit', 'fits', 'fitting', 'seizure', 'seizures', 'shaking uncontrollably', 'twitching'])) {
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

  // Neonatal Hypothermia: a low temperature can also signal serious infection in young infants
  if (input.ageMonths !== undefined && input.ageMonths < 3 && input.temperature && input.temperature < 36) {
    flags.push({
      id: 'neonate-hypothermia',
      message: 'Low Temperature in Young Infant',
      subtext: 'A temperature below 36°C in an infant under 3 months can be a sign of serious infection and needs urgent medical review.',
      severity: 'Urgent'
    });
  }

  // Respiratory Distress Logic
  const respDistressKeywords = ['difficulty breathing', 'grunting', 'wheezing', 'chest sucking', 'fast breathing', 'stridor', 'noisy breathing', 'retractions'];
  const hasRespDistress = mentions(symptomString, respDistressKeywords);

  if (hasRespDistress) {
    flags.push({
      id: 'resp-distress',
      message: 'Respiratory Distress Detected',
      subtext: 'Signs of increased work of breathing (grunting, wheezing, or chest retractions) require immediate professional assessment.',
      severity: 'Urgent'
    });
  }

  // Altered Consciousness / Lethargy
  const lethargyKeywords = ['floppy', 'lethargic', 'unresponsive', 'wont wake', 'hard to wake', 'difficult to wake', 'unusually sleepy', 'very drowsy', 'unconscious'];
  if (mentions(symptomString, lethargyKeywords)) {
    flags.push({
      id: 'altered-consciousness',
      message: 'Decreased Level of Consciousness',
      subtext: 'If your child is unusually floppy, lethargic, or difficult to wake, seek emergency care immediately.',
      severity: 'Urgent'
    });
  }

  // Possible Meningococcal Disease / Sepsis
  const rashKeywords = ['non-blanching', 'non blanching', 'nonblanching', 'doesnt fade', 'does not fade', 'dont fade', 'petechiae', 'petechial', 'purpura', 'purpuric', 'purple spots', 'purple rash'];
  if (mentions(symptomString, rashKeywords)) {
    flags.push({
      id: 'non-blanching-rash',
      message: 'Non-Blanching Rash',
      subtext: 'Purple or red spots that do not fade when pressed can be a sign of meningococcal infection or sepsis. Call 000 or go to the nearest emergency department now.',
      severity: 'Urgent'
    });
  }

  // Poor Perfusion / Cyanosis
  const colourKeywords = ['blue lips', 'lips are blue', 'lips turning blue', 'turning blue', 'blue around the mouth', 'grey skin', 'mottled'];
  if (mentions(symptomString, colourKeywords)) {
    flags.push({
      id: 'cyanosis-mottling',
      message: 'Abnormal Skin Colour',
      subtext: 'Blue lips, grey or mottled skin can mean the child is not getting enough oxygen or blood flow. Seek emergency care immediately.',
      severity: 'Urgent'
    });
  }

  // Dehydration Signs
  const dehydrationKeywords = ['no wet nappy', 'dry mouth', 'crying without tears', 'sunken eyes', 'not peeing'];
  if (mentions(symptomString, dehydrationKeywords)) {
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
