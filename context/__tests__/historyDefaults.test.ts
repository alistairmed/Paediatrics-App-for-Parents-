import { describe, test, expect } from 'vitest';
import { withHistoryDefaults, DEFAULT_HISTORY } from '../historyDefaults';

describe('Saved history defaults', () => {
  test('Empty or invalid saved data gives the full default history', () => {
    expect(withHistoryDefaults(undefined)).toEqual(DEFAULT_HISTORY);
    expect(withHistoryDefaults('not an object')).toEqual(DEFAULT_HISTORY);
  });

  test('Fills missing fields from an older save, keeping saved values', () => {
    const old = { acuteLogs: [{ id: 'a', timestamp: '2026-01-01T00:00:00Z', type: 'Fluid', value: '100 ml' }], pastMedicalHistory: 'Asthma' };
    const h = withHistoryDefaults(old);
    expect(h.pastMedicalHistory).toBe('Asthma');
    expect(h.acuteLogs).toHaveLength(1);
    expect(h.familyHistory.members).toEqual([]);
    expect(h.sickDayPlan.redZone).toBe('');
    expect(h.appointments).toEqual([]);
  });

  test('Fills nested fields and replaces wrongly-typed lists', () => {
    const h = withHistoryDefaults({ developmentalHistory: { prenatal: { complications: 'GDM' } }, appointments: null, familyHistory: { maternal: 'T1DM' } });
    expect(h.developmentalHistory.prenatal.complications).toBe('GDM');
    expect(h.developmentalHistory.prenatal.scansNormal).toBe(true);
    expect(h.developmentalHistory.neonatal.nicuStay).toBe(false);
    expect(h.appointments).toEqual([]);
    expect(h.familyHistory.maternal).toBe('T1DM');
    expect(h.familyHistory.members).toEqual([]);
  });
});
