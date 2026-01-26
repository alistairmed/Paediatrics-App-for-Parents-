
import { RedFlag } from "./redFlags";

/**
 * WHO IMCI (Integrated Management of Childhood Illness) General Danger Signs.
 * These are simplified, high-specificity signs for settings with limited resources.
 */
export function evaluateIMCIRedFlags(input: { symptoms: string[] }): RedFlag[] {
  const flags: RedFlag[] = [];
  const symptomString = input.symptoms.join(' ').toLowerCase();

  const IMCI_RULES = [
    {
      keywords: ['not drinking', 'unable to drink', 'cannot drink', 'refusing breast'],
      id: 'imci-not-drinking',
      message: 'Urgent Danger Sign: Unable to Drink',
      subtext: 'The child is unable to drink or breastfeed, indicating a critical systemic illness.'
    },
    {
      keywords: ['vomits everything', 'persistent vomiting', 'cannot keep anything down'],
      id: 'imci-vomiting',
      message: 'Urgent Danger Sign: Persistent Vomiting',
      subtext: 'Vomiting everything is a general danger sign in IMCI protocols requiring urgent referral.'
    },
    {
      keywords: ['convulsions', 'fit', 'seizure', 'shaking uncontrollably'],
      id: 'imci-convulsions',
      message: 'Urgent Danger Sign: Convulsions',
      subtext: 'Convulsions during this current illness are a critical neurological indicator.'
    },
    {
      keywords: ['lethargic', 'unconscious', 'hard to wake', 'floppy', 'not responding'],
      id: 'imci-consciousness',
      message: 'Urgent Danger Sign: Altered Consciousness',
      subtext: 'Lethargy or unconsciousness indicates severe disease or metabolic crisis.'
    }
  ];

  IMCI_RULES.forEach(rule => {
    if (rule.keywords.some(kw => symptomString.includes(kw))) {
      flags.push({
        id: rule.id,
        message: rule.message,
        subtext: rule.subtext,
        severity: 'Urgent'
      });
    }
  });

  return flags;
}
