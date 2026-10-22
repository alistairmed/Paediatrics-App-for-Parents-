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

  test('Matching: Recognises phrasing with apostrophes', () => {
    const ids = (text: string) => evaluateRedFlags({ symptoms: [text] }).map(f => f.id);
    expect(ids("She won't drink anything")).toContain('imci-not-drinking');
    expect(ids('He won\u2019t wake up properly')).toContain('altered-consciousness');
  });

  test('Matching: Does not match keywords inside other words', () => {
    const flags = evaluateRedFlags({ symptoms: ['Wearing a new outfit, otherwise well'] });
    expect(flags.some(f => f.id === 'imci-convulsions')).toBe(false);
  });

  test('Matching: Still detects a fit described in a sentence', () => {
    const flags = evaluateRedFlags({ symptoms: ['He had a fit this morning'] });
    expect(flags.some(f => f.id === 'imci-convulsions')).toBe(true);
  });

  test('Critical: Flags a non-blanching rash', () => {
    const flags = evaluateRedFlags({ symptoms: ["Purple spots that don't fade when I press a glass on them"] });
    expect(flags.some(f => f.id === 'non-blanching-rash' && f.severity === 'Urgent')).toBe(true);
  });

  test('Critical: Flags blue lips or mottled skin', () => {
    const flags = evaluateRedFlags({ symptoms: ['Her lips are blue and skin looks mottled'] });
    expect(flags.some(f => f.id === 'cyanosis-mottling')).toBe(true);
  });

  test('Critical: Flags low temperature in an infant under 3 months', () => {
    const flags = evaluateRedFlags({ ageMonths: 1, temperature: 35.6, symptoms: [] });
    expect(flags.some(f => f.id === 'neonate-hypothermia')).toBe(true);
  });

  test('Safety: Does not flag low-normal temperature in an older child', () => {
    const flags = evaluateRedFlags({ ageMonths: 30, temperature: 35.8, symptoms: [] });
    expect(flags.some(f => f.id === 'neonate-hypothermia')).toBe(false);
  });
});
