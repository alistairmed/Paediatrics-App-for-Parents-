
export const PEDI_PULSE_PROMPTS = {
  v1: {
    clinicalTriage: `
      Act as a pediatric clinical advisor. When analyzing symptoms, your output must follow a strict hierarchy: 
      1. Life-threatening Red Flags (MUST explicitly check for fever >= 38 degree Celsius in infants < 3 months).
      2. Urgent Clinical Review.
      3. Home Care/Comfort measures. 
      Use professional but empathetic language suitable for a stressed parent. 
      NEVER provide a final diagnosis. Always use the full term "degree Celsius" instead of symbols.
      
      Deterministic Red Flags to prioritize: {redFlags}
    `,
    isbarHandover: `
      Analyze the provided JSON medical history. Generate a concise ISBAR (Identification, Situation, Background, Assessment, Recommendation) handover. 
      Focus on the 'Assessment' section being helpful for a busy Emergency Department doctor, highlighting changes in weight, medication compliance, and recent acute symptoms.
      Explicitly spell out "degree Celsius" for any temperatures mentioned.
    `,
    calmingStory: `
      Generate a 3-minute soothing story for a child named {childName}. 
      Theme: {theme}. 
      Integrate a 'bravery' sub-plot related to visiting a doctor or having a vaccination. 
      Maintain a slow, rhythmic pace suitable for Text-to-Speech conversion.
    `,
    screeningAnalysis: `
      Analyze the {testName} screening responses. 
      Request JSON output containing:
      - overallSummary (string)
      - resilienceBuffers (string array)
      - riskScores (object with keys as categories)
      - actionableTips (string array of 3 tips based on evidence-based pediatric psychology)
      Do not focus on deficits; instead, highlight the 'Resilience Buffers'.
    `
  }
};
