
import { GoogleGenAI, Modality, Type } from "@google/genai";

const getAIClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeSymptoms = async (description: string, imageBase64?: string) => {
  const ai = getAIClient();
  const model = 'gemini-3-flash-preview';
  
  const prompt = `
    You are a supportive and professional pediatric clinical triage assistant. 
    Your goal is to provide guideline-based interpretation of childhood symptoms.
    
    PATIENT REPORT: "${description}"
    ${imageBase64 ? "VISUAL EVIDENCE: A photo of the symptom has been provided." : ""}
    
    Structure your response with:
    1. Potential Observations:
    2. Home Care Advice:
    3. Triage Guide: (Green, Yellow, Red)
    4. Questions for Parent:
  `;

  const contents: any = { parts: [{ text: prompt }] };
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
    text: response.text,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};

export const prepareAppointmentQuestions = async (profileData: any, appointment: any) => {
  const ai = getAIClient();
  const model = 'gemini-3-flash-preview';

  const prompt = `
    You are a pediatric clinical nurse navigator specializing in complex care coordination.
    Prepare a structured list of 5-7 high-value clinical questions for a parent to ask during an appointment with a ${appointment.specialty} (${appointment.provider}).
    
    CONTEXT:
    Child's Name: ${profileData.name || 'Child'}
    Active Diagnoses: ${JSON.stringify(profileData.conditions?.map((c: any) => c.name) || [])}
    Current Medications: ${JSON.stringify(profileData.currentMedications?.map((m: any) => `${m.name} ${m.dose}`) || [])}
    Appointment Purpose: ${appointment.purpose}
    
    GUIDELINES:
    1. Focus on Australian clinical best practices (e.g., RCH Melbourne, QCH).
    2. Include questions about: medication side effects, long-term prognosis, impact on daily life/schooling, and specific red flags for this condition.
    3. Format as a clean list with each question on a new line starting with "• ".
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt
  });

  return response.text;
};

export const analyzeMedicalReport = async (imageBase64: string) => {
  const ai = getAIClient();
  const model = 'gemini-3-flash-preview';
  const prompt = `
    OCR and synthesize this pediatric medical document. 
    Extract clinical details to help a parent keep their records updated.
  `;
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
          specialist: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              specialty: { type: Type.STRING },
              hospital: { type: Type.STRING }
            },
            required: ["name", "specialty"]
          },
          foundDiagnoses: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Any new or confirmed diagnoses mentioned in the letter."
          },
          foundMedications: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                dose: { type: Type.STRING },
                instructions: { type: Type.STRING },
                indication: { type: Type.STRING }
              },
              required: ["name"]
            }
          },
          summary: { type: Type.STRING },
          actionItems: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["specialist", "foundDiagnoses", "foundMedications", "summary", "actionItems"]
      }
    }
  });
  return JSON.parse(response.text || '{}');
};

export const calculateDosage = async (weightKg: number, medication: string) => {
  const ai = getAIClient();
  const model = 'gemini-3-pro-preview';
  const prompt = `Calculate safe pediatric dosage for ${medication} at ${weightKg}kg.`;
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

export const generateCalmingStory = async (childName: string, theme: string) => {
  const ai = getAIClient();
  const prompt = `Tell a short calming story for ${childName} about ${theme}.`;
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

export const analyzeMedicalProfile = async (profileData: any) => {
  const ai = getAIClient();
  const model = 'gemini-3-pro-preview';
  const prompt = `Prepare ISBAR handover from data: ${JSON.stringify(profileData)}`;
  const response = await ai.models.generateContent({
    model,
    contents: prompt
  });
  return {
    text: response.text,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};

export const getVaccineAdvice = async (vaccineName: string) => {
  const ai = getAIClient();
  const model = 'gemini-3-flash-preview';
  const prompt = `Advice for ${vaccineName} vaccine.`;
  const response = await ai.models.generateContent({
    model,
    contents: prompt
  });
  return { text: response.text, sources: [] };
};

export const analyzeScreening = async (testName: string, responses: any) => {
  const ai = getAIClient();
  const model = 'gemini-3-flash-preview';
  const prompt = `Analyze ${testName} screening.`;
  const response = await ai.models.generateContent({
    model,
    contents: prompt
  });
  return { text: response.text, sources: [] };
};

export const getParentingAdvice = async (age: string, challenge: string) => {
  const ai = getAIClient();
  const model = 'gemini-3-flash-preview';
  const prompt = `Advice for parent of ${age} child regarding ${challenge}.`;
  const response = await ai.models.generateContent({
    model,
    contents: prompt
  });
  return { text: response.text, sources: [] };
};
