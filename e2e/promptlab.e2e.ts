import { test, expect } from '@playwright/test';
import { openWithChild } from './helpers';

const ON = process.env.VITE_ENABLE_PROMPT_TOOL === 'true';

test('Prompt generator is hidden in the normal build', async ({ page }) => {
  test.skip(ON, 'Flag is on for this run');
  await openWithChild(page, 'promptlab');
  await expect(page.getByRole('heading', { name: 'Prompt generator' })).toHaveCount(0);
});

// Run with: VITE_ENABLE_PROMPT_TOOL=true npx playwright test e2e/promptlab.e2e.ts --project=desktop
test('Prompt generator fills in a prompt from the form', async ({ page }) => {
  test.skip(!ON, 'Needs a build with VITE_ENABLE_PROMPT_TOOL=true');
  await openWithChild(page, 'promptlab');
  await expect(page.getByRole('heading', { name: 'Prompt generator' })).toBeVisible();
  await page.getByLabel('Branch name').fill('claude/test-branch');
  await page.getByLabel(/Task/).fill('- Fix the header\nAdd a test');
  const out = page.getByLabel('Generated prompt');
  await expect(out).toContainText('Branch: claude/test-branch');
  await expect(out).toContainText('- Fix the header');
  await expect(out).toContainText('Never push to main.');
  await page.getByLabel('Type of prompt').selectOption('design');
  await expect(out).toContainText('#C2603C');
});
