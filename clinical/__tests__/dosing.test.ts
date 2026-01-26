
import { describe, test, expect } from 'vitest';
import { calculateSafetyCeiling, DOSING_GUIDELINES } from '../dosing';

describe('Dosing Safety Engine - Extended Validation', () => {
  test('Paracetamol: Caps dose at 1000mg for heavy children (e.g. 80kg)', () => {
    const result = calculateSafetyCeiling(80, 'Paracetamol');
    expect(result?.mgPerDose).toBe(DOSING_GUIDELINES.PARACETAMOL.MAX_SINGLE_MG);
  });

  test('Paracetamol: Calculates 15mg/kg for standard weight (10kg)', () => {
    const result = calculateSafetyCeiling(10, 'Paracetamol');
    expect(result?.mgPerDose).toBe(150);
  });

  test('Ibuprofen: Caps dose at 400mg for heavy children', () => {
    const result = calculateSafetyCeiling(60, 'Ibuprofen');
    expect(result?.mgPerDose).toBe(400);
  });

  test('Safety: Rejects extreme weight (under 2kg) as likely error', () => {
    const result = calculateSafetyCeiling(1.5, 'Paracetamol');
    expect(result).toBeNull();
  });

  test('Safety: Rejects extreme weight (over 150kg) as unit error', () => {
    const result = calculateSafetyCeiling(160, 'Paracetamol');
    expect(result).toBeNull();
  });

  test('Safety: Returns null for unknown medications', () => {
    const result = calculateSafetyCeiling(10, 'Magic Syrup');
    expect(result).toBeNull();
  });
});
