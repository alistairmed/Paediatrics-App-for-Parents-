// Fix: added imports for Vitest globals to resolve 'Cannot find name' errors
import { describe, test, expect } from 'vitest';
import { evaluateRedFlags } from '../redFlags';

/**
 * These tests are meant for Vitest/Jest environments.
 * They represent the clinical safety audit trail for the app.
 */
describe('Clinical Red Flag Engine', () => {
  test('Critical: Flags neonate fever (under 3mo, temp >= 38)', () => {
    const flags = evaluateRedFlags({
      ageMonths: 2,
      temperature: 38.1,
      symptoms: []
    });
    expect(flags.some(f => f.id === 'neonate-fever')).toBe(true);
    expect(flags[0].severity).toBe('Urgent');
  });

  test('Critical: Flags respiratory distress keywords', () => {
    const flags = evaluateRedFlags({
      symptoms: ['The baby is grunting while breathing']
    });
    expect(flags.some(f => f.id === 'resp-distress')).toBe(true);
  });

  test('Informational: Flags prolonged illness (over 5 days)', () => {
    const flags = evaluateRedFlags({
      durationDays: 6,
      symptoms: ['Mild cough']
    });
    expect(flags.some(f => f.id === 'prolonged-illness')).toBe(true);
    expect(flags.find(f => f.id === 'prolonged-illness')?.severity).toBe('Moderate');
  });

  test('Safety: Does not flag normal temperature in older child', () => {
    const flags = evaluateRedFlags({
      ageMonths: 24,
      temperature: 37.2,
      symptoms: []
    });
    expect(flags.length).toBe(0);
  });
});