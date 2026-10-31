import { test, expect } from '@playwright/test';
import { openWithChild, trackErrors } from './helpers';

const VIEWS = [
  'dashboard', 'symptoms', 'sickday', 'dosage', 'acutelogs', 'appointments',
  'profile', 'history', 'familyhistory', 'devices', 'diagnostics', 'reports', 'summary', 'handover',
  'growth', 'vaccines', 'redbook', 'milestones', 'developmental', 'screening',
  'parenting', 'bonding', 'stories', 'setup', 'ethics', 'governance', 'regulatory', 'privacy', 'terms',
];

for (const view of VIEWS) {
  test(`${view} opens without errors`, async ({ page }) => {
    const errors = trackErrors(page);
    await openWithChild(page, view);
    await expect(page.getByRole('heading').first()).toBeVisible();
    expect(errors).toEqual([]);
  });
}
