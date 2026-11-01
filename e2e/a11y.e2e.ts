import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { openWithChild } from './helpers';

// The screens parents use most. Serious and critical WCAG 2.1 AA problems fail the test.
const VIEWS = ['dashboard', 'symptoms', 'dosage', 'growth', 'vaccines', 'summary', 'screening', 'setup', 'ethics', 'privacy', 'sickday', 'redbook', 'milestones', 'handover', 'parenting'];

for (const view of VIEWS) {
  test(`${view} has no serious accessibility problems`, async ({ page }) => {
    await openWithChild(page, view);
    await expect(page.getByRole('heading').first()).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    const serious = results.violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
    const summary = serious.map(v => `${v.id}: ${v.nodes.slice(0, 3).map(n => n.target.join(' ')).join(' | ')}`);
    expect(summary).toEqual([]);
  });
}

test('toasts are readable', async ({ page }) => {
  await openWithChild(page, 'growth');
  await page.getByLabel('Weight (kg)').fill('8');
  await page.getByRole('button', { name: 'Save Measurement' }).click();
  await expect(page.getByText('Measurement saved.')).toBeVisible();
  const results = await new AxeBuilder({ page }).include('[role=status], [role=alert]').withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations.filter(v => v.impact === 'serious' || v.impact === 'critical').map(v => v.id)).toEqual([]);
});
