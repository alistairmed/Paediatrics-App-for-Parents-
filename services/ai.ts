import { PEDI_PULSE_PROMPTS, withSafetyInstruction } from './prompts';

export { withSafetyInstruction };
import { AI_ENABLED, PREMIUM_ENABLED } from '../config/features';
import { AI_FEATURES, AiFeature } from '../config/aiFeatures';
import { ensureAiConsent, takeAiQuota, AI_DAILY_LIMIT, getPremiumCode } from './aiGuard';
import { deidentifiedSummary, SummaryInput } from './deidentify';
import { Appointment, MedicalHistory } from '../types';

export type AiErrorType = 'RATE_LIMIT' | 'AUTH' | 'TIMEOUT' | 'NETWORK' | 'DISABLED' | 'CONSENT' | 'PREMIUM' | 'UNKNOWN';

export class AiError extends Error {
  type: AiErrorType;
  status?: number;

  constructor(message: string, type: AiErrorType = 'UNKNOWN', status?: number) {
    super(message);
    this.name = 'AiError';
    this.type = type;
    this.status = status;
    Object.setPrototypeOf(this, AiError.prototype);
  }
}

/** What /api/ai returns, whichever provider answered. */
export interface AiResponse {
  text: string;
  sources: { web: { uri: string; title?: string } }[];
  audio?: string;
}

/**
 * Calls the single AI endpoint (/api/ai) with a 30s timeout. The tier comes
 * from config/aiFeatures.ts, and the server checks it again; premium
 * requests carry the parent's premium access code. Keys stay on the server.
 */
export async function callAi(payload: { feature: AiFeature; [key: string]: any }, timeoutMs = 30000): Promise<AiResponse> {
  if (!AI_ENABLED) {
    throw new AiError('AI features are switched off in this version.', 'DISABLED');
  }
  const tier = AI_FEATURES[payload.feature].tier;
  if (tier === 'premium' && !PREMIUM_ENABLED) {
    throw new AiError('Premium features are coming soon.', 'PREMIUM', 503);
  }
  if (!(await ensureAiConsent())) {
    throw new AiError('Nothing was sent. AI features need your permission first.', 'CONSENT');
  }
  if (!takeAiQuota()) {
    throw new AiError(`You've used today's ${AI_DAILY_LIMIT} AI requests on this device. Please try again tomorrow.`, 'RATE_LIMIT', 429);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const code = tier === 'premium' ? getPremiumCode() : null;
    if (code) headers.Authorization = `Bearer ${code}`;
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers,
      body: JSON.stringify(withSafetyInstruction({ ...payload, tier })),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      // The server returns a generic message and the status code only.
      const status = res.status;
      if (status === 429) {
        throw new AiError(
          tier === 'premium'
            ? "You've used this month's premium requests, or too many requests were sent. Please try again later."
            : 'You have reached the AI limit for now. Please try again later.',
          'RATE_LIMIT',
          429
        );
      }
      if (tier === 'premium' && (status === 401 || status === 503)) {
        throw new AiError(
          status === 401 ? "Your premium access code isn't valid or has expired." : "Premium features aren't available right now.",
          'PREMIUM',
          status
        );
      }
      if (status === 401 || status === 403) {
        throw new AiError("The AI service couldn't be used right now.", 'AUTH', status);
      }
      throw new AiError("The AI service couldn't answer. Please try again later.", 'UNKNOWN', status);
    }

    return await res.json();
  } catch (err: any) {
    clearTimeout(timeoutId);

    if (err instanceof AiError) {
      console.error('[PediPulse AI Error]', { type: err.type, status: err.status, message: err.message });
      throw err;
    }

    if (err.name === 'AbortError') {
      const timeoutError = new AiError(
        'Request timed out. The AI service took too long to respond (30s limit).',
        'TIMEOUT',
        408
      );
      console.error('[PediPulse AI Error]', { type: timeoutError.type, message: timeoutError.message });
      throw timeoutError;
    }

    const netError = new AiError(
      'Unable to connect to AI services. Please check your network connection and try again.',
      'NETWORK'
    );
    console.error('[PediPulse AI Error]', { type: netError.type, originalError: err?.message || String(err) });
    throw netError;
  }
}

export const analyzeScreening = async (testName: string, responses: any) => {
  const prompt = `${PEDI_PULSE_PROMPTS.v1.screeningAnalysis.replace('{testName}', testName)}\n\nRESPONSES: ${JSON.stringify(responses)}`;

  const data = await callAi({
    feature: 'screening-summary',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          overallSummary: { type: 'STRING' },
          resilienceBuffers: { type: 'ARRAY', items: { type: 'STRING' } },
          riskScores: { type: 'OBJECT', description: 'Key value pairs of categories and scores' },
          actionableTips: { type: 'ARRAY', items: { type: 'STRING' } },
        },
        required: ['overallSummary', 'resilienceBuffers', 'actionableTips'],
      },
    },
  });

  const text = data.text || '{}';
  return JSON.parse(text);
};

/**
 * Premium: a handover / GP letter summary. Only a de-identified summary is
 * sent (services/deidentify.ts): no name, date of birth or contact details.
 */
export const analyzeMedicalProfile = async (input: SummaryInput) => {
  const prompt = `${PEDI_PULSE_PROMPTS.v1.isbarHandover}\n\nDE-IDENTIFIED SUMMARY: ${JSON.stringify(deidentifiedSummary(input))}`;

  const data = await callAi({
    feature: 'handover',
    contents: prompt,
  });

  return { text: data.text || '', sources: data.sources || [] };
};

export const generateCalmingStory = async (childName: string, theme: string) => {
  const prompt = PEDI_PULSE_PROMPTS.v1.calmingStory
    .replace('{childName}', childName)
    .replace('{theme}', theme);

  const data = await callAi({
    feature: 'calm-story',
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
    },
  });

  return data.audio;
};

export const getVaccineAdvice = async (vaccineName: string) => {
  const prompt = `Provide a general explanation of the ${vaccineName} vaccine in the context of the Australian National Immunisation Program. Include what it protects against, common side effects, and why it is important. Base it on the Australian Immunisation Handbook. Do not advise delaying, skipping or changing any vaccine; for questions about this child's vaccines, refer the parent to their GP or immunisation provider. Spell out "degree Celsius" for any temperature mentions.`;

  const data = await callAi({
    feature: 'vaccine-information',
    contents: prompt,
    config: { tools: [{ googleSearch: {} }] },
  });

  const text = data.text || '';
  const sources = data.sources || [];

  return { text, sources };
};

export const getParentingAdvice = async (ageGroup: string, challenge: string) => {
  const prompt = `Provide evidence-based parenting strategies for a child in the ${ageGroup} age group facing the following challenge: "${challenge}". Reference reliable Australian resources like the Raising Children Network or RCH Melbourne.`;

  const data = await callAi({
    feature: 'parenting-tips',
    contents: prompt,
    config: { tools: [{ googleSearch: {} }] },
  });

  const text = data.text || '';
  const sources = data.sources || [];

  return { text, sources };
};

/** Premium: longer, structured parenting guidance. No child details are sent. */
export const getParentingGuidance = async (ageGroup: string, challenge: string) => {
  const prompt = `Write in-depth, evidence-based parenting guidance for a child in the ${ageGroup} age group, about this challenge: "${challenge}".
  Structure it as: what is typical at this age; why it may be happening; practical strategies to try over the next few weeks; how to look after yourself as a parent; and questions to ask your GP or child health nurse.
  Refer to reliable Australian resources such as the Raising Children Network and RCH Melbourne. Do not diagnose, and do not give medicine or dose advice.`;

  const data = await callAi({
    feature: 'parenting-guidance',
    contents: prompt,
  });

  return { text: data.text || '', sources: [] };
};

export const explainMedicalTerm = async (term: string, ageGroup: string = 'infant') => {
  const prompt = `Explain the medical term or condition "${term}" for a parent with a child in the "${ageGroup}" group.
  Use simple, supportive language.
  Format your response clearly with:
  1. Simple Definition
  2. Common Symptoms
  3. Questions the parent could ask their GP or child health nurse
  Do not give advice about treatment, doses or when to seek care.
  Reference reliable Australian sources (RCH Melbourne, Raising Children Network).`;

  const data = await callAi({
    feature: 'medical-term',
    contents: prompt,
  });

  const text = data.text || '';
  const sources = data.sources || [];

  return { text, sources };
};

export const prepareAppointmentQuestions = async (
  history: MedicalHistory,
  appointment: Appointment,
  recentRedFlags: string[] = []
) => {

  const context = {
    pastMedicalHistory: history.pastMedicalHistory,
    currentMedications: history.currentMedications,
    recentAcuteLogs: history.acuteLogs?.slice(0, 10),
    notedToDiscuss: recentRedFlags,
    appointment: {
      provider: appointment.provider,
      specialty: appointment.specialty,
      purpose: appointment.purpose,
    },
  };

  const prompt = `Based on the following medical history and the purpose of the upcoming appointment, generate 5-7 high-quality, clinical questions for the parent to ask the specialist (${appointment.specialty}) during the visit.
  Include questions about anything the parent has noted to discuss: ${recentRedFlags.join(', ') || 'nothing noted'}.
  
  CONTEXT:
  ${JSON.stringify(context)}
  
  FORMAT: Provide a bulleted list of questions.`;

  const data = await callAi({
    feature: 'appointment-questions',
    contents: prompt,
  });

  const text = data.text || '';
  return text || 'No questions generated.';
};

export const analyzeMedicalReport = async (imageBase64: string) => {
  const data = await callAi({
    feature: 'report-reading',
    contents: [
      {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: imageBase64.split(',')[1] || imageBase64 } },
          { text: 'OCR and synthesize this pediatric medical document. Extract clinical details. Always spell out "degree Celsius".' },
        ],
      },
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          specialist: {
            type: 'OBJECT',
            properties: { name: { type: 'STRING' }, specialty: { type: 'STRING' } },
            required: ['name'],
          },
          foundDiagnoses: { type: 'ARRAY', items: { type: 'STRING' } },
          foundMedications: {
            type: 'ARRAY',
            items: { type: 'OBJECT', properties: { name: { type: 'STRING' }, dose: { type: 'STRING' } } },
          },
          summary: { type: 'STRING' },
          actionItems: { type: 'ARRAY', items: { type: 'STRING' } },
        },
      },
    },
  });

  const text = data.text || '{}';
  return JSON.parse(text);
};
