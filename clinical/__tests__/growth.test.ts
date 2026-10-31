import { describe, test, expect } from 'vitest';
import { lmsAt, valueAtZ, growthPercentile, describePercentile, normalCdf, ageInMonthsAt } from '../growth';

describe('WHO growth percentiles', () => {
  test('Median weight gives the 50th percentile (boys 12 months: 9.6479 kg)', () => {
    expect(growthPercentile('male', 'weight', 12, 9.6479)).toBeCloseTo(50, 1);
  });

  test('Percentile lines match WHO published values (boys at birth: 3rd 2.5 kg, 97th 4.3 kg)', () => {
    const lms = lmsAt('male', 'weight', 0)!;
    // WHO's published percentile tables round to 0.1 kg.
    expect(Math.abs(valueAtZ(lms, -1.881) - 2.5)).toBeLessThanOrEqual(0.051);
    expect(Math.abs(valueAtZ(lms, 1.881) - 4.3)).toBeLessThanOrEqual(0.051);
  });

  test('Girls 24 months median weight 11.4775 kg; median length about 85.7 cm', () => {
    expect(growthPercentile('female', 'weight', 24, 11.4775)).toBeCloseTo(50, 1);
    expect(valueAtZ(lmsAt('female', 'length', 24)!, 0)).toBeCloseTo(85.7, 0);
  });

  test('Outside 0-5 years there is no WHO percentile', () => {
    expect(growthPercentile('male', 'weight', 61, 19)).toBeNull();
    expect(growthPercentile('male', 'weight', -1, 3)).toBeNull();
  });

  test('Helpers', () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 6);
    expect(normalCdf(1.881)).toBeCloseTo(0.97, 2);
    expect(describePercentile(62.4)).toBe('62nd');
    expect(describePercentile(3.2)).toBe('3rd');
    expect(describePercentile(11)).toBe('11th');
    expect(describePercentile(0.4)).toBe('below the 1st');
    expect(ageInMonthsAt('2026-01-01', '2027-01-01')).toBeCloseTo(12, 0);
  });
});
