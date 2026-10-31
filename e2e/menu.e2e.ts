import { test, expect } from '@playwright/test';
import { openWithChild } from './helpers';

test('the phone menu groups sections and navigates', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone layout only');
  await openWithChild(page);
  await page.getByRole('button', { name: 'More sections' }).click();
  const menu = page.getByRole('dialog', { name: 'All sections' });
  for (const group of ['Today', 'Records', 'Growth & Development', 'Support', 'Settings & Safety']) {
    await expect(menu.getByRole('heading', { name: group, exact: true })).toBeVisible();
  }
  await menu.getByRole('button', { name: 'Growth Charts' }).click();
  await expect(menu).toBeHidden();
  await expect(page).toHaveURL(/#\/growth/);
});

test('the desktop sidebar marks the current section', async ({ page, isMobile }) => {
  test.skip(!!isMobile, 'desktop layout only');
  await openWithChild(page, 'vaccines');
  await expect(page.getByRole('navigation', { name: 'Sections' }).getByRole('button', { name: 'Vaccines' })).toHaveAttribute('aria-current', 'page');
});
