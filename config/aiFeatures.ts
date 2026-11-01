/**
 * Which tier each AI feature needs. The server (api/ai.ts) enforces this map;
 * the app reads it only to label features and pick the tier it asks for.
 *
 * - free: Google Gemini 2.5 Flash
 * - premium: Anthropic Claude, with an entitlement token, and only ever sent
 *   a de-identified summary (services/deidentify.ts)
 */
export type AiTier = 'free' | 'premium';

export interface AiFeatureConfig {
  tier: AiTier;
  /** Plain name shown to parents. */
  label: string;
  /** Google Search grounding (free tier only). */
  search?: boolean;
  /** Upper limit on the model's output for this feature. */
  maxOutputTokens: number;
}

export const AI_FEATURES = {
  'vaccine-information': { tier: 'free', label: 'Vaccine information', search: true, maxOutputTokens: 1500 },
  'calm-story': { tier: 'free', label: 'Calming story', maxOutputTokens: 2000 },
  'appointment-questions': { tier: 'free', label: 'Appointment questions', maxOutputTokens: 1000 },
  'parenting-tips': { tier: 'free', label: 'Short parenting tips', search: true, maxOutputTokens: 1200 },
  'medical-term': { tier: 'free', label: 'Explain a medical term', maxOutputTokens: 1200 },
  'screening-summary': { tier: 'free', label: 'Checklist summary', maxOutputTokens: 1500 },
  'report-reading': { tier: 'free', label: 'Read a letter', maxOutputTokens: 2000 },
  'handover': { tier: 'premium', label: 'Handover and GP letter summary', maxOutputTokens: 6000 },
  'parenting-guidance': { tier: 'premium', label: 'In-depth parenting guidance', maxOutputTokens: 6000 },
} as const satisfies Record<string, AiFeatureConfig>;

export type AiFeature = keyof typeof AI_FEATURES;

export const isAiFeature = (value: unknown): value is AiFeature =>
  typeof value === 'string' && Object.prototype.hasOwnProperty.call(AI_FEATURES, value);

export const featureConfig = (feature: AiFeature): AiFeatureConfig => AI_FEATURES[feature];

/** Models each provider may be called with. */
export const AI_MODELS = {
  free: ['gemini-2.5-flash'],
  premium: ['claude-sonnet-5-5'],
} as const satisfies Record<AiTier, readonly string[]>;

/** Caps on what a request may send, checked on the server before any provider call. */
export const AI_INPUT_LIMITS = {
  /** Characters of text across the prompt and any feature instruction (about 6,000 tokens). */
  maxTextChars: 24_000,
  /** Characters of base64 image data (free tier only; premium is text-only). */
  maxImageChars: 4_000_000,
};
