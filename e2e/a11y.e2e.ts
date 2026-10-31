import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { openWithChild } from './helpers';

// The screens parents use most. Serious and critical WCAG 2.1 AA problems fail the test.
const VIEWS = ['dashboard', 'symptoms', 'dosage', 'growth', 'vaccines', 'summary', 'screening', 'setup', 'ethics', 'privacy', 'sickday', 'redbook', 'milestones'];

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
