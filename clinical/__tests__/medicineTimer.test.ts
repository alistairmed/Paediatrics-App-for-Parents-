import { describe, test, expect } from 'vitest';
import { medicineStatus } from '../medicineTimer';

const now = new Date('2026-10-31T12:00:00');
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600_000);

describe('Medicine timing reminders', () => {
  test('Nothing given: allowed now', () => {
    const s = medicineStatus('Paracetamol', [], now);
    expect(s.nextAllowedAt).toBeNull();
    expect(s.dosesInLast24Hours).toBe(0);
  });

  test('Paracetamol 2 hours ago: next allowed 4 hours after it', () => {
    const s = medicineStatus('Paracetamol', [hoursAgo(2)], now);
    expect(s.nextAllowedAt).toEqual(new Date('2026-10-31T14:00:00'));
    expect(s.dosesInLast24Hours).toBe(1);
  });

  test('Ibuprofen needs 6 hours between doses', () => {
    expect(medicineStatus('Ibuprofen', [hoursAgo(5)], now).nextAllowedAt).toEqual(new Date('2026-10-31T13:00:00'));
    expect(medicineStatus('Ibuprofen', [hoursAgo(6)], now).nextAllowedAt).toBeNull();
  });

  test('Paracetamol: 4 doses in 24 hours means waiting until the oldest is 24 hours old', () => {
    const s = medicineStatus('Paracetamol', [hoursAgo(20), hoursAgo(15), hoursAgo(10), hoursAgo(5)], now);
    expect(s.dosesInLast24Hours).toBe(4);
    expect(s.nextAllowedAt).toEqual(new Date('2026-10-31T16:00:00')); // 20h ago + 24h
  });

  test('Ibuprofen: 3 doses in 24 hours is the limit', () => {
    const s = medicineStatus('Ibuprofen', [hoursAgo(22), hoursAgo(14), hoursAgo(7)], now);
    expect(s.nextAllowedAt).toEqual(new Date('2026-10-31T14:00:00')); // 22h ago + 24h
  });

  test('Doses older than 24 hours do not count; future and invalid times are ignored', () => {
    const s = medicineStatus('Paracetamol', [hoursAgo(30), new Date('nonsense'), new Date(now.getTime() + 3600_000)], now);
    expect(s.dosesInLast24Hours).toBe(0);
    expect(s.nextAllowedAt).toBeNull();
  });
});
