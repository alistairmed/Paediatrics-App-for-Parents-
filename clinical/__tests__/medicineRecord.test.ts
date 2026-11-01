import { describe, test, expect } from 'vitest';
import { medicineSummary } from '../medicineRecord';

const now = new Date('2026-10-31T12:00:00');
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600_000);

describe('Medicine record summary', () => {
  test('Nothing recorded', () => {
    expect(medicineSummary([], now)).toEqual({ lastGiven: null, dosesInLast24Hours: 0 });
  });

  test('Finds the most recent dose and counts the last 24 hours', () => {
    const s = medicineSummary([hoursAgo(5), hoursAgo(30), hoursAgo(1), hoursAgo(23.9)], now);
    expect(s.lastGiven).toEqual(hoursAgo(1));
    expect(s.dosesInLast24Hours).toBe(3);
  });

  test('Ignores future and invalid times', () => {
    const s = medicineSummary([new Date('nonsense'), new Date(now.getTime() + 3600_000), hoursAgo(2)], now);
    expect(s).toEqual({ lastGiven: hoursAgo(2), dosesInLast24Hours: 1 });
  });
});
