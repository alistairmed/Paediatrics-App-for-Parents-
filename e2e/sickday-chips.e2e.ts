import { test, expect } from '@playwright/test';
import { openWithChild } from './helpers';

test('Sick Day Log type buttons all fit on a small phone and are easy to tap', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
  await openWithChild(page, 'acutelogs');
  const group = page.getByRole('group', { name: 'Type of entry' });
  await expect(group).toBeVisible();
  const buttons = group.getByRole('button');
  await expect(buttons).toHaveCount(4);
  for (let i = 0; i < 4; i++) {
    const box = await buttons.nth(i).boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(375);
  }
});

test('Sick Day Log heading is in plain English', async ({ page }) => {
  await openWithChild(page, 'acutelogs');
  await expect(page.getByRole('heading', { level: 2, name: 'Sick day log' })).toBeVisible();
  await expect(page.getByText('Surveillance')).toHaveCount(0);
});
