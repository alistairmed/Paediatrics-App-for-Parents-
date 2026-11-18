import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { openWithChild } from './helpers';

// A 1x1 PNG, enough to stand in for a photo of a letter.
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

test('a letter can be added by hand, with a photo, and nothing is sent to an AI service', async ({ page }) => {
  const apiRequests: string[] = [];
  page.on('request', r => { if (r.url().includes('/api/')) apiRequests.push(r.url()); });

  await openWithChild(page, 'reports');
  await page.getByRole('button', { name: 'Add a letter by hand' }).click();
  await expect(page.getByText(/Nothing here is sent to an AI service/)).toBeVisible();

  await page.getByLabel('Who wrote it').fill('Dr Lee, paediatrics');
  await page.getByLabel('What the letter says').fill('Review again in six months.');
  await page.getByLabel('Choose a photo of the letter to keep on this device').setInputFiles({ name: 'letter.png', mimeType: 'image/png', buffer: PNG });
  await expect(page.getByRole('img', { name: 'Photo of the letter' })).toBeVisible();

  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(results.violations.filter(v => v.impact === 'serious' || v.impact === 'critical').map(v => v.id)).toEqual([]);

  await page.getByRole('button', { name: 'Save letter' }).click();
  await expect(page.getByText('Dr Lee, paediatrics')).toBeVisible();
  await expect(page.getByText('Review again in six months.')).toBeVisible();

  expect(apiRequests).toEqual([]);
});
