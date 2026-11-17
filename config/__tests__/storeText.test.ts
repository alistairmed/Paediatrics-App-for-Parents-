import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// Store limits: App Store and Google Play title 30, App Store subtitle 30,
// Play short description 80, App Store keywords 100.
const LIMITS: Record<string, number> = {
  Title: 30,
  'Subtitle (App Store)': 30,
  'Short description (Play)': 80,
  'Keywords (App Store)': 100,
};

function storeRows(): Map<string, { draft: string; length: number }> {
  const md = readFileSync(resolve(__dirname, '../../docs/STORE_RELEASE.md'), 'utf8');
  const section = md.slice(md.indexOf('## 7. Draft store text'), md.indexOf('## 8.'));
  const rows = new Map<string, { draft: string; length: number }>();
  for (const line of section.split('\n')) {
    const cells = line.split('|').map((c) => c.trim());
    if (cells.length < 5 || !(cells[1] in LIMITS)) continue;
    rows.set(cells[1], { draft: cells[2], length: Number(cells[3]) });
  }
  return rows;
}

describe('draft store text', () => {
  const rows = storeRows();

  it('has every limited field', () => {
    expect([...rows.keys()].sort()).toEqual(Object.keys(LIMITS).sort());
  });

  it.each(Object.entries(LIMITS))('%s fits its limit and the stated length is right', (field, limit) => {
    const row = rows.get(field)!;
    expect(row.draft.length).toBeLessThanOrEqual(limit);
    expect(row.draft.length).toBe(row.length);
  });
});
