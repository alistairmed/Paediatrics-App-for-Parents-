import { test, expect } from '@playwright/test';
import { openWithChild } from './helpers';

// The test child was born 15 Sep 2025; fix "today" so statuses are predictable.
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-01T10:00:00'));
});

test('home shows overdue visits, the next due date and the NIP note', async ({ page }) => {
  await openWithChild(page, 'dashboard');
  const card = page.getByRole('region', { name: 'Vaccines' });
  await expect(card.getByText('Overdue: Birth, 2 months, 4 months, 6 months, 12 months')).toBeVisible();
  await expect(card.getByText('Next due: 18 months, 15 Mar 2027')).toBeVisible();
  await expect(card.getByText('Based on the NIP schedule. Confirm with your GP or the Australian Immunisation Register.')).toBeVisible();
});

test('the vaccine screen lists the school programs and updates when a dose is recorded', async ({ page }) => {
  await openWithChild(page, 'vaccines');
  await expect(page.getByRole('heading', { name: 'Year 7 (school program)' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Year 10 (school program)' })).toBeVisible();

  await page.getByRole('checkbox', { name: '12 months: mark as received' }).check();
  await expect(page.getByRole('checkbox', { name: '12 months: mark as received' })).toBeChecked();

  await page.goto('/#/dashboard');
  const card = page.getByRole('region', { name: 'Vaccines' });
  await expect(card.getByText('Overdue: Birth, 2 months, 4 months, 6 months')).toBeVisible();
  await expect(card.getByText('Next due: 18 months, 15 Mar 2027')).toBeVisible();
});
