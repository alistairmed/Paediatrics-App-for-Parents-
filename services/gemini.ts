
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { PEDI_PULSE_PROMPTS } from "./prompts";
import { MedicalHistory, Appointment } from "../types";

const getAIClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeSymptoms = async (description: string, imageBase64?: string, activeRedFlags: string[] = []) => {
  const ai = getAIClient();
  const model = 'gemini-3-flash-preview';
  
  const prompt = PEDI_PULSE_PROMPTS.v1.clinicalTriage.replace('{redFlags}', activeRedFlags.join(', '));
  const fullInput = `${prompt}\n\nPATIENT REPORT: "${description}"\n${imageBase64 ? "VISUAL EVIDENCE: A photo is attached." : ""}`;

  const contents: any = { parts: [{ text: fullInput }] };
  if (imageBase64) {
    contents.parts.unshift({
      inlineData: {
        mimeType: 'image/jpeg',
        data: imageBase64.split(',')[1] || imageBase64
      }
    });
  }

  const response = await ai.models.generateContent({
    model,
    contents,
    config: { tools: [{ googleSearch: {} }] }
  });

  return {
    text: response.text || '',
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};

export const analyzeScreening = async (testName: string, responses: any) => {
  const ai = getAIClient();
  const model = 'gemini-3-flash-preview';
  const prompt = PEDI_PULSE_PROMPTS.v1.screeningAnalysis.replace('{testName}', testName);
  const input = `${prompt}\n\nRESPONSES: ${JSON.stringify(responses)}`;

  const response = await ai.models.generateContent({
    model,
    contents: input,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          overallSummary: { type: Type.STRING },
          resilienceBuffers: { type: Type.ARRAY, items: { type: Type.STRING } },
          riskScores: { type: Type.OBJECT, properties: {}, description: "Key value pairs of categories and scores" },
          actionableTips: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["overallSummary", "resilienceBuffers", "actionableTips"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const analyzeMedicalProfile = async (profileData: any) => {
  const ai = getAIClient();
  const model = 'gemini-3-pro-preview';
  
  const compactHistory = {
    ...profileData,
    history: {
      ...profileData.history,
      acuteLogs: profileData.history.acuteLogs?.slice(0, 10) || []
    }
  };

  const prompt = PEDI_PULSE_PROMPTS.v1.isbarHandover;
  const input = `${prompt}\n\nDATA: ${JSON.stringify(compactHistory)}`;
  
  const response = await ai.models.generateContent({
    model,
    contents: input
  });

  return {
    text: response.text || '',
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};

export const generateCalmingStory = async (childName: string, theme: string) => {
  const ai = getAIClient();
  const prompt = PEDI_PULSE_PROMPTS.v1.calmingStory
    .replace('{childName}', childName)
    .replace('{theme}', theme);

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};

export const getVaccineAdvice = async (vaccineName: string) => {
  const ai = getAIClient();
  const model = 'gemini-3-flash-preview';
  const prompt = `Provide a detailed explanation of the ${vaccineName} vaccine in the context of the Australian National Immunisation Program. Include what it protects against, common side effects, and why it is important. Spell out "degree Celsius" for any temperature mentions.`;
  
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: { tools: [{ googleSearch: {} }] }
  });

  return {
    text: response.text || '',
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};

export const getParentingAdvice = async (ageGroup: string, challenge: string) => {
  const ai = getAIClient();
  const model = 'gemini-3-flash-preview';
  const prompt = `Provide evidence-based parenting strategies for a child in the ${ageGroup} age group facing the following challenge: "${challenge}". Reference reliable Australian resources like the Raising Children Network or RCH Melbourne.`;
  
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: { tools: [{ googleSearch: {} }] }
  });

  return {
    text: response.text || '',
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};

export const prepareAppointmentQuestions = async (history: MedicalHistory, appointment: Appointment, recentRedFlags: string[] = []) => {
  const ai = getAIClient();
  const model = 'gemini-3-pro-preview';
  
  const context = {
    pastMedicalHistory: history.pastMedicalHistory,
    currentMedications: history.currentMedications,
    recentAcuteLogs: history.acuteLogs?.slice(0, 10),
    recentSafetyAlerts: recentRedFlags,
    appointment: {
      provider: appointment.provider,
      specialty: appointment.specialty,
      purpose: appointment.purpose
    }
  };

  const prompt = `Based on the following medical history and the purpose of the upcoming appointment, generate 5-7 high-quality, clinical questions for the parent to ask the specialist (${appointment.specialty}) during the visit.
  Specifically address these recent safety alerts: ${recentRedFlags.join(', ') || 'None identified'}.
  
  CONTEXT:
  ${JSON.stringify(context)}
  
  FORMAT: Provide a bulleted list of questions.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt
  });

  return response.text || 'No questions generated.';
};

export const analyzeMedicalReport = async (imageBase64: string) => {
  const ai = getAIClient();
  const model = 'gemini-3-flash-preview';
  const prompt = `OCR and synthesize this pediatric medical document. Extract clinical details. Always spell out "degree Celsius".`;
  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: imageBase64.split(',')[1] || imageBase64 } },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          specialist: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, specialty: { type: Type.STRING } }, required: ["name"] },
          foundDiagnoses: { type: Type.ARRAY, items: { type: Type.STRING } },
          foundMedications: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, dose: { type: Type.STRING } } } },
          summary: { type: Type.STRING },
          actionItems: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });
  return JSON.parse(response.text || '{}');
};

export const calculateDosage = async (weightKg: number, medication: string) => {
  const ai = getAIClient();
  const model = 'gemini-3-pro-preview';
  const prompt = `Calculate safe pediatric dosage for ${medication} at ${weightKg}kg. Ensure adherence to Australian clinical standards. Spell out "degree Celsius".`;
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          medicationName: { type: Type.STRING },
          recommendedDose: { type: Type.STRING },
          frequency: { type: Type.STRING },
          maxDose24h: { type: Type.STRING },
          cautionaryNotes: { type: Type.STRING }
        }
      }
    }
  });
  return JSON.parse(response.text || '{}');
};
