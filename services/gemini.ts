import { PEDI_PULSE_PROMPTS } from './prompts';
import { MedicalHistory, Appointment } from '../types';

export type GeminiErrorType = 'RATE_LIMIT' | 'AUTH' | 'TIMEOUT' | 'NETWORK' | 'UNKNOWN';

export class GeminiError extends Error {
  type: GeminiErrorType;
  status?: number;

  constructor(message: string, type: GeminiErrorType = 'UNKNOWN', status?: number) {
    super(message);
    this.name = 'GeminiError';
    this.type = type;
    this.status = status;
    Object.setPrototypeOf(this, GeminiError.prototype);
  }
}

/**
 * Proxy caller for Gemini API with 30s timeout, error classification, and sanitized logging.
 */
export async function callGeminiProxy(payload: any, timeoutMs = 30000): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const status = res.status;
      const errorJson = await res.json().catch(() => ({}));
      const errorMsg = errorJson.error || errorJson.details || errorJson.message || '';

      if (
        status === 429 ||
        errorMsg.includes('429') ||
        errorMsg.includes('RESOURCE_EXHAUSTED') ||
        errorMsg.toLowerCase().includes('quota') ||
        errorMsg.toLowerCase().includes('rate limit')
      ) {
        throw new GeminiError(
          'You have reached the daily AI limit. Please try again tomorrow.',
          'RATE_LIMIT',
          429
        );
      }

      if (
        status === 401 ||
        status === 403 ||
        errorMsg.toLowerCase().includes('api_key') ||
        errorMsg.toLowerCase().includes('auth')
      ) {
        throw new GeminiError(
          'Gemini API authentication failed. Please check your API key configuration.',
          'AUTH',
          status
        );
      }

      // If /api/gemini returns 404 (e.g. running in pure Vite dev mode without server proxy)
      const directKey =
        (typeof import.meta !== 'undefined' &&
          ((import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.GEMINI_API_KEY)) ||
        (typeof process !== 'undefined' &&
          (process.env?.GEMINI_API_KEY || process.env?.API_KEY));

      if (status === 404 && directKey) {
        return await callDirectGemini(payload, directKey, timeoutMs);
      }

      throw new GeminiError(
        errorMsg || `Gemini API request failed with status ${status}`,
        'UNKNOWN',
        status
      );
    }

    return await res.json();
  } catch (err: any) {
    clearTimeout(timeoutId);

    if (err instanceof GeminiError) {
      console.error('[PediPulse AI Error]', { type: err.type, status: err.status, message: err.message });
      throw err;
    }

    if (err.name === 'AbortError') {
      const timeoutError = new GeminiError(
        'Request timed out. The AI service took too long to respond (30s limit).',
        'TIMEOUT',
        408
      );
      console.error('[PediPulse AI Error]', { type: timeoutError.type, message: timeoutError.message });
      throw timeoutError;
    }

    // Direct fallback if fetch('/api/gemini') failed (e.g. network connection to local endpoint)
    const directKey =
      (typeof import.meta !== 'undefined' &&
        ((import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.GEMINI_API_KEY)) ||
      (typeof process !== 'undefined' &&
        (process.env?.GEMINI_API_KEY || process.env?.API_KEY));

    if (directKey) {
      try {
        return await callDirectGemini(payload, directKey, timeoutMs);
      } catch (fallbackErr: any) {
        if (fallbackErr instanceof GeminiError) throw fallbackErr;
      }
    }

    const netError = new GeminiError(
      'Unable to connect to AI services. Please check your network connection and try again.',
      'NETWORK'
    );
    console.error('[PediPulse AI Error]', { type: netError.type, originalError: err?.message || String(err) });
    throw netError;
  }
}

async function callDirectGemini(payload: any, apiKey: string, timeoutMs: number): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const model = payload.model || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const contents = Array.isArray(payload.contents)
    ? payload.contents
    : [{ parts: typeof payload.contents === 'string' ? [{ text: payload.contents }] : [payload.contents] }];

  const reqBody: any = { contents };

  if (payload.config) {
    if (payload.config.tools) reqBody.tools = payload.config.tools;
    const genConfig: any = {};
    if (payload.config.responseMimeType) genConfig.responseMimeType = payload.config.responseMimeType;
    if (payload.config.responseSchema) genConfig.responseSchema = payload.config.responseSchema;
    if (payload.config.responseModalities) genConfig.responseModalities = payload.config.responseModalities;
    if (payload.config.speechConfig) genConfig.speechConfig = payload.config.speechConfig;
    if (payload.config.temperature !== undefined) genConfig.temperature = payload.config.temperature;
    if (Object.keys(genConfig).length > 0) reqBody.generationConfig = genConfig;
  }

  if (payload.systemInstruction) {
    reqBody.systemInstruction =
      typeof payload.systemInstruction === 'string'
        ? { parts: [{ text: payload.systemInstruction }] }
        : payload.systemInstruction;
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(reqBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      if (res.status === 429) {
        throw new GeminiError(
          'You have reached the daily AI limit. Please try again tomorrow.',
          'RATE_LIMIT',
          429
        );
      }
      throw new GeminiError(`Direct Gemini API call failed with status ${res.status}`, 'UNKNOWN', res.status);
    }

    return await res.json();
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err instanceof GeminiError) throw err;
    if (err.name === 'AbortError') {
      throw new GeminiError('Request timed out (30s limit).', 'TIMEOUT', 408);
    }
    throw new GeminiError('Failed connecting directly to Gemini API.', 'NETWORK');
  }
}

export const analyzeSymptoms = async (description: string, imageBase64?: string, activeRedFlags: string[] = []) => {
  const model = 'gemini-2.5-flash';
  const parts: any[] = [
    {
      text: `${PEDI_PULSE_PROMPTS.v1.clinicalTriage.replace('{redFlags}', activeRedFlags.join(', '))}\n\nPATIENT REPORT: "${description}"\n${imageBase64 ? 'VISUAL EVIDENCE: A photo is attached.' : ''}`,
    },
  ];

  if (imageBase64) {
    parts.unshift({
      inlineData: {
        mimeType: 'image/jpeg',
        data: imageBase64.split(',')[1] || imageBase64,
      },
    });
  }

  const data = await callGeminiProxy({
    model,
    contents: [{ parts }],
    config: { tools: [{ googleSearch: {} }] },
  });

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const sources = data.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

  return { text, sources };
};

export const analyzeScreening = async (testName: string, responses: any) => {
  const model = 'gemini-2.5-flash';
  const prompt = `${PEDI_PULSE_PROMPTS.v1.screeningAnalysis.replace('{testName}', testName)}\n\nRESPONSES: ${JSON.stringify(responses)}`;

  const data = await callGeminiProxy({
    model,
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

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  return JSON.parse(text);
};

export const analyzeMedicalProfile = async (profileData: any) => {
  const model = 'gemini-2.5-flash';
  const compactHistory = {
    ...profileData,
    history: {
      ...profileData.history,
      acuteLogs: profileData.history?.acuteLogs?.slice(0, 10) || [],
    },
  };

  const prompt = `${PEDI_PULSE_PROMPTS.v1.isbarHandover}\n\nDATA: ${JSON.stringify(compactHistory)}`;

  const data = await callGeminiProxy({
    model,
    contents: prompt,
  });

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const sources = data.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

  return { text, sources };
};

export const generateCalmingStory = async (childName: string, theme: string) => {
  const prompt = PEDI_PULSE_PROMPTS.v1.calmingStory
    .replace('{childName}', childName)
    .replace('{theme}', theme);

  const data = await callGeminiProxy({
    model: 'gemini-2.5-flash',
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
    },
  });

  return data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};

export const getVaccineAdvice = async (vaccineName: string) => {
  const model = 'gemini-2.5-flash';
  const prompt = `Provide a detailed explanation of the ${vaccineName} vaccine in the context of the Australian National Immunisation Program. Include what it protects against, common side effects, and why it is important. Spell out "degree Celsius" for any temperature mentions.`;

  const data = await callGeminiProxy({
    model,
    contents: prompt,
    config: { tools: [{ googleSearch: {} }] },
  });

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const sources = data.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

  return { text, sources };
};

export const getParentingAdvice = async (ageGroup: string, challenge: string) => {
  const model = 'gemini-2.5-flash';
  const prompt = `Provide evidence-based parenting strategies for a child in the ${ageGroup} age group facing the following challenge: "${challenge}". Reference reliable Australian resources like the Raising Children Network or RCH Melbourne.`;

  const data = await callGeminiProxy({
    model,
    contents: prompt,
    config: { tools: [{ googleSearch: {} }] },
  });

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const sources = data.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

  return { text, sources };
};

export const explainMedicalTerm = async (term: string, ageGroup: string = 'infant') => {
  const model = 'gemini-2.5-flash';
  const prompt = `Explain the medical term or condition "${term}" for a parent with a child in the "${ageGroup}" group.
  Use simple, supportive language.
  Format your response clearly with:
  1. Simple Definition
  2. Common Symptoms
  3. Actionable Advice
  4. When to seek urgent care.
  Reference reliable Australian sources (RCH Melbourne, Raising Children Network).`;

  const data = await callGeminiProxy({
    model,
    contents: prompt,
    config: { tools: [{ googleSearch: {} }] },
  });

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const sources = data.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

  return { text, sources };
};

export const prepareAppointmentQuestions = async (
  history: MedicalHistory,
  appointment: Appointment,
  recentRedFlags: string[] = []
) => {
  const model = 'gemini-2.5-flash';

  const context = {
    pastMedicalHistory: history.pastMedicalHistory,
    currentMedications: history.currentMedications,
    recentAcuteLogs: history.acuteLogs?.slice(0, 10),
    recentSafetyAlerts: recentRedFlags,
    appointment: {
      provider: appointment.provider,
      specialty: appointment.specialty,
      purpose: appointment.purpose,
    },
  };

  const prompt = `Based on the following medical history and the purpose of the upcoming appointment, generate 5-7 high-quality, clinical questions for the parent to ask the specialist (${appointment.specialty}) during the visit.
  Specifically address these recent safety alerts: ${recentRedFlags.join(', ') || 'None identified'}.
  
  CONTEXT:
  ${JSON.stringify(context)}
  
  FORMAT: Provide a bulleted list of questions.`;

  const data = await callGeminiProxy({
    model,
    contents: prompt,
  });

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return text || 'No questions generated.';
};

export const analyzeMedicalReport = async (imageBase64: string) => {
  const model = 'gemini-2.5-flash';
  const data = await callGeminiProxy({
    model,
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

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  return JSON.parse(text);
};

export const calculateDosage = async (weightKg: number, medication: string) => {
  const model = 'gemini-2.5-flash';
  const prompt = `Calculate safe pediatric dosage for ${medication} at ${weightKg}kg. Ensure adherence to Australian clinical standards. Spell out "degree Celsius".`;

  const data = await callGeminiProxy({
    model,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          medicationName: { type: 'STRING' },
          recommendedDose: { type: 'STRING' },
          frequency: { type: 'STRING' },
          maxDose24h: { type: 'STRING' },
          cautionaryNotes: { type: 'STRING' },
        },
      },
    },
  });

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  return JSON.parse(text);
};
