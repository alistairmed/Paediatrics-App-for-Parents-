import { test, expect } from '@playwright/test';
import { openWithChild } from './helpers';

const EMOJI = /\p{Extended_Pictographic}/u;

test.use({ viewport: { width: 375, height: 667 } });

test('Buttons and chips in the Sick Day Log, vaccines, profile and activity log have no emoji', async ({ page }) => {
  for (const view of ['acutelogs', 'vaccines', 'profile', 'governance']) {
    await openWithChild(page, view);
    await page.waitForTimeout(300);
    const withEmoji = await page.evaluate((src) => {
      const re = new RegExp(src, 'u');
      return Array.from(document.querySelectorAll('main button, main [role=tab]'))
        .map(el => (el.textContent || '').trim())
        .filter(t => re.test(t));
    }, EMOJI.source);
    expect(withEmoji, view).toEqual([]);
  }
});
