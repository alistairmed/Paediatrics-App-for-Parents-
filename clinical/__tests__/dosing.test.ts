
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

  test('Age: Flags ibuprofen as not recommended under 3 months', () => {
    expect(calculateSafetyCeiling(5, 'Ibuprofen', 2)?.contraindication).toBeDefined();
    expect(calculateSafetyCeiling(6, 'Ibuprofen', 3)?.contraindication).toBeUndefined();
  });

  test('Age: Flags paracetamol under 1 month as doctor-advice only', () => {
    expect(calculateSafetyCeiling(3.5, 'Paracetamol', 0)?.contraindication).toBeDefined();
    expect(calculateSafetyCeiling(4.5, 'Paracetamol', 1)?.contraindication).toBeUndefined();
  });

  test('Age: No contraindication when age is unknown', () => {
    expect(calculateSafetyCeiling(5, 'Ibuprofen')?.contraindication).toBeUndefined();
  });

  test('Weight: Flags ibuprofen under 5 kg even when age is unknown or over 3 months', () => {
    expect(calculateSafetyCeiling(4.8, 'Ibuprofen')?.contraindication).toMatch(/under 5 kg/);
    expect(calculateSafetyCeiling(4.8, 'Ibuprofen', 4)?.contraindication).toMatch(/under 5 kg/);
    expect(calculateSafetyCeiling(4.8, 'Paracetamol', 4)?.contraindication).toBeUndefined();
  });
});
