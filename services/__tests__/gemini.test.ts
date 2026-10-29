import { describe, test, expect } from 'vitest';
import { withSafetyInstruction } from '../gemini';
import { SAFETY_SYSTEM_INSTRUCTION } from '../prompts';

describe('AI safety instruction', () => {
  test('Adds the safety instruction to every request', () => {
    const payload = withSafetyInstruction({ model: 'gemini-2.5-flash', contents: 'Tell me about MMR' });
    expect(payload.systemInstruction).toBe(SAFETY_SYSTEM_INSTRUCTION);
    expect(payload.contents).toBe('Tell me about MMR');
  });

  test('Keeps a feature-specific instruction, after the safety one', () => {
    const fromString = withSafetyInstruction({ contents: 'x', systemInstruction: 'Answer in bullet points.' });
    expect(fromString.systemInstruction).toBe(`${SAFETY_SYSTEM_INSTRUCTION}\n\nAnswer in bullet points.`);

    const fromParts = withSafetyInstruction({ contents: 'x', systemInstruction: { parts: [{ text: 'Be brief.' }] } });
    expect(fromParts.systemInstruction).toBe(`${SAFETY_SYSTEM_INSTRUCTION}\n\nBe brief.`);
  });

  test('Safety instruction rules out medical advice and doses', () => {
    expect(SAFETY_SYSTEM_INSTRUCTION).toMatch(/do not give medical advice/i);
    expect(SAFETY_SYSTEM_INSTRUCTION).toMatch(/never state or adjust a medicine dose/i);
    expect(SAFETY_SYSTEM_INSTRUCTION).toMatch(/000/);
  });
});
