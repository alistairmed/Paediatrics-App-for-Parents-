import { test, expect } from '@playwright/test';
import { openWithChild } from './helpers';

// Default build: AI and premium are off, so premium features say "coming soon" and nothing is sent.
test('premium features show as coming soon and send nothing', async ({ page }) => {
  const aiRequests: string[] = [];
  page.on('request', r => { if (r.url().includes('/api/')) aiRequests.push(r.url()); });

  await openWithChild(page, 'handover');
  await expect(page.getByRole('note', { name: /handover and GP letter summary: Premium, coming soon/i })).toBeVisible();

  await page.goto('/#/parenting');
  await page.getByRole('button', { name: 'AI Strategies' }).click();
  await expect(page.getByRole('note', { name: /In-depth parenting guidance: Premium, coming soon/i })).toBeVisible();

  expect(aiRequests).toEqual([]);
});
