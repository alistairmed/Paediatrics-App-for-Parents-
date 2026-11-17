import { test, expect } from '@playwright/test';
import { openWithChild } from './helpers';

test('The app header shows the kangaroo logo, not an emoji, and the favicon is the logo', async ({ page, request }) => {
  await openWithChild(page, 'dashboard');
  const home = page.locator('button[aria-label="Paeds Pouch home"]:visible').first();
  await expect(home.locator('svg')).toBeVisible();
  expect(await home.textContent()).not.toMatch(/\p{Extended_Pictographic}/u);

  await expect(page.locator('link[rel="icon"][type="image/svg+xml"]')).toHaveCount(1);
  const res = await request.get('/favicon.svg');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('svg');
});
