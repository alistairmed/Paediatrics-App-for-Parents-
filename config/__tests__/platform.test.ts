import { describe, test, expect } from 'vitest';
import { apiUrl } from '../platform';

describe('API base URL', () => {
  test('Empty on the web: same-origin path', () => {
    expect(apiUrl('/api/ai', '')).toBe('/api/ai');
  });

  test('Native builds call the deployed site', () => {
    expect(apiUrl('/api/ai', 'https://paedspouch.com.au')).toBe('https://paedspouch.com.au/api/ai');
    expect(apiUrl('/api/ai', 'https://paedspouch.com.au/')).toBe('https://paedspouch.com.au/api/ai');
    expect(apiUrl('api/ai', ' https://paedspouch.com.au ')).toBe('https://paedspouch.com.au/api/ai');
  });

  test('Refuses plain http except localhost for development', () => {
    expect(() => apiUrl('/api/ai', 'http://paedspouch.com.au')).toThrow(/https/);
    expect(apiUrl('/api/ai', 'http://localhost:3000')).toBe('http://localhost:3000/api/ai');
  });
});
