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

test('Headings use the self-hosted Fraunces font and nothing is fetched from Google', async ({ page }) => {
  const external: string[] = [];
  page.on('request', r => { if (!r.url().startsWith('http://localhost')) external.push(r.url()); });
  await openWithChild(page, 'acutelogs');
  await page.evaluate(() => document.fonts.load('700 24px Fraunces'));
  const h = page.locator('main h2').first();
  await expect(h).toBeVisible();
  expect(await h.evaluate(el => getComputedStyle(el).fontFamily)).toContain('Fraunces');
  expect(await page.evaluate(() => document.fonts.check('700 24px Fraunces'))).toBe(true);
  expect(external).toEqual([]);
});

test('The About and Safety page links to the website, Instagram and Facebook', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await openWithChild(page, 'ethics');
  const section = page.getByRole('region', { name: 'Find Paeds Pouch online' });
  await expect(section).toBeVisible();
  for (const [name, url] of [
    ['Website', 'https://paedspouch.vercel.app'],
    ['Instagram', 'https://www.instagram.com/paedspouch'],
    ['Facebook', 'https://www.facebook.com/paedspouch'],
  ]) {
    const link = section.getByRole('link', { name });
    await expect(link).toHaveAttribute('href', url);
    await expect(link).toHaveAttribute('rel', /noopener/);
    expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }
});
