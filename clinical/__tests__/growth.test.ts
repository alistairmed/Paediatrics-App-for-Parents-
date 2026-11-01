import { describe, test, expect } from 'vitest';
import { lmsAt, valueAtZ, growthPercentile, describePercentile, normalCdf, ageInMonthsAt, PERCENTILE_LINES } from '../growth';

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

// Reference LMS values from the WHO Child Growth Standards tables
// (weight-for-age, length/height-for-age, head circumference-for-age).
describe('WHO LMS reference points', () => {
  const cases: [string, Parameters<typeof lmsAt>[0], Parameters<typeof lmsAt>[1], number, [number, number, number]][] = [
    ['boys weight, birth', 'male', 'weight', 0, [0.3487, 3.3464, 0.14602]],
    ['girls weight, birth', 'female', 'weight', 0, [0.3809, 3.2322, 0.14171]],
    ['boys weight, 12 months', 'male', 'weight', 12, [0.0644, 9.6479, 0.10925]],
    ['girls weight, 24 months', 'female', 'weight', 24, [-0.2941, 11.4775, 0.1239]],
    ['boys length, birth', 'male', 'length', 0, [1, 49.8842, 0.03795]],
    ['girls length, birth', 'female', 'length', 0, [1, 49.1477, 0.0379]],
    ['boys height, 24 months', 'male', 'length', 24, [1, 87.1161, 0.03507]],
    ['girls height, 24 months', 'female', 'length', 24, [1, 85.7153, 0.03764]],
    ['boys height, 60 months', 'male', 'length', 60, [1, 109.9638, 0.04214]],
    ['boys head, birth', 'male', 'head', 0, [1, 34.4618, 0.03686]],
    ['girls head, birth', 'female', 'head', 0, [1, 33.8787, 0.03496]],
  ];
  for (const [name, sex, measure, age, [L, M, S]] of cases) {
    test(name, () => {
      const lms = lmsAt(sex, measure, age)!;
      expect(lms[0]).toBeCloseTo(L, 3);
      expect(lms[1]).toBeCloseTo(M, 3);
      expect(lms[2]).toBeCloseTo(S, 4);
    });
  }

  test('Length is used just before 24 months, height from 24 months', () => {
    expect(lmsAt('male', 'length', 23.999)![1]).toBeCloseTo(87.8161, 1);
    expect(lmsAt('male', 'length', 24)![1]).toBeCloseTo(87.1161, 3);
  });

  test('The five chart lines are the 3rd, 15th, 50th, 85th and 97th percentiles', () => {
    expect(PERCENTILE_LINES.map(l => Math.round(normalCdf(l.z) * 100))).toEqual([3, 15, 50, 85, 97]);
  });

  test('A measurement on a percentile line reads back as that percentile', () => {
    const lms = lmsAt('female', 'head', 6)!;
    for (const { z } of PERCENTILE_LINES) {
      expect(growthPercentile('female', 'head', 6, valueAtZ(lms, z))).toBeCloseTo(normalCdf(z) * 100, 3);
    }
  });
});
