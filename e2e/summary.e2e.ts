import { test, expect } from '@playwright/test';
import { CHILD } from './helpers';

// A busy record: the summary must still print on one A4 page.
const HISTORY = {
  allergies: ['Penicillin', 'Peanuts', 'Egg'],
  conditions: [
    { id: 'c1', name: 'Asthma', status: 'Active' },
    { id: 'c2', name: 'Eczema', status: 'Active' },
    { id: 'c3', name: 'Reflux', status: 'Resolved' },
  ],
  currentMedications: [
    { id: 'm1', name: 'Salbutamol inhaler', dose: '2 puffs as directed', indication: 'Wheeze' },
    { id: 'm2', name: 'Moisturiser', dose: 'Twice daily', indication: 'Eczema' },
  ],
  pastMedicalHistory: 'Bronchiolitis at 3 months, admitted overnight. Recurrent ear infections.',
  surgicalHistory: '',
  growthRecords: [
    { age: 2, date: '2025-11-15', weight: 5.2, height: 57, headCircumference: 38.5 },
    { age: 6, date: '2026-03-15', weight: 7.4, height: 66, headCircumference: 42.5 },
    { age: 12, date: '2026-09-15', weight: 9.1, height: 74.5, headCircumference: 45.4 },
  ],
  vaccinations: [
    { id: 'nip-birth', status: 'completed', receivedDate: '2025-09-15' },
    { id: 'nip-2mo', status: 'completed', receivedDate: '2025-11-17' },
    { id: 'nip-4mo', status: 'completed', receivedDate: '2026-01-16' },
  ],
  acuteLogs: [],
  appointments: [],
};

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-01T10:00:00'));
  await page.addInitScript(([child, history]) => {
    localStorage.setItem('pedipulse_disclaimer_accepted', 'true');
    localStorage.setItem('pedipulse_children', JSON.stringify({ activeId: (child as any).id, children: [child] }));
    localStorage.setItem(`pedipulse_history:${(child as any).id}`, JSON.stringify(history));
  }, [CHILD, HISTORY] as const);
});

test('the summary has the essentials for the doctor', async ({ page }) => {
  await page.goto('/#/summary');
  const summary = page.getByRole('article', { name: 'Printable summary' });
  await expect(summary.getByRole('heading', { name: 'Mia', level: 1 })).toBeVisible();
  await expect(summary.getByText(/Born 15 Sept? 2025/)).toBeVisible();
  for (const text of ['Penicillin', 'Peanuts', 'Asthma', 'Eczema']) await expect(summary.getByText(text, { exact: true })).toBeVisible();
  await expect(summary.getByText('Reflux')).toHaveCount(0); // resolved conditions are left out
  await expect(summary.getByText(/Weight: 9.1 kg .*percentile \(WHO\)/)).toBeVisible();
  await expect(summary.getByText(/Length \/ height: 74.5 cm .*percentile \(WHO\)/)).toBeVisible();
  await expect(summary.getByText(/Head circumference: 45.4 cm .*percentile \(WHO\)/)).toBeVisible();
  await expect(summary.getByText(/Given: Birth .*2 months .*4 months/)).toBeVisible();
  await expect(summary.getByText(/Overdue \(not recorded\): 6 months, 12 months/)).toBeVisible();
  await expect(summary.getByText(/Next due: 18 months, 15 Mar 2027/)).toBeVisible();
  await expect(summary.getByText('Based on the NIP schedule. Confirm with your GP or the Australian Immunisation Register.')).toBeVisible();
});

test('the summary prints on one A4 page without the app menus', async ({ page, browserName, isMobile }) => {
  test.skip(browserName !== 'chromium' || !!isMobile, 'PDF output is checked once, in desktop Chromium');
  await page.goto('/#/summary');
  await page.getByLabel(/Anything you want to tell the doctor/).fill('Worse at night for three days. Using the inhaler more often.');
  await page.emulateMedia({ media: 'print' });
  await expect(page.getByRole('navigation', { name: 'Sections' })).toBeHidden();
  await expect(page.getByRole('button', { name: 'Print or Save as PDF' })).toBeHidden();
  const pdf = (await page.pdf({ format: 'A4', printBackground: true })).toString('latin1');
  expect((pdf.match(/\/Type\s*\/Page[^s]/g) || []).length).toBe(1);
});
