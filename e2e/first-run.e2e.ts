import { test, expect } from '@playwright/test';
import { trackErrors } from './helpers';

test('a new parent accepts the notice, adds a child and reaches Home', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  const notice = page.getByRole('dialog', { name: 'Purpose & Safety Notice' });
  await expect(notice).toBeVisible();
  await notice.getByRole('button', { name: 'I Understand & Agree' }).click();
  await expect(notice).toBeHidden();

  await expect(page.getByRole('heading', { name: 'Add your child' })).toBeVisible();
  await page.getByLabel("Child's name").fill('Ava');
  await page.getByLabel('Date of birth').fill('2025-03-01');
  await page.getByText('Female', { exact: true }).click();
  await page.getByRole('button', { name: 'Add Ava' }).click();

  await expect(page).toHaveURL(/#\/dashboard/);
  await expect(page.getByText('Ava').filter({ visible: true }).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('the privacy policy and terms can be read before agreeing', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/#/privacy');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Privacy Policy', level: 1 }).or(page.getByRole('heading', { name: 'Privacy Policy' }).first())).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Purpose & Safety Notice' })).toBeHidden();
  await page.goto('/#/terms');
  await expect(page.getByRole('heading', { name: /Terms of Use/ }).first()).toBeVisible();
});
