import { test, expect } from '@playwright/test';
import { openWithChild, trackErrors } from './helpers';

test('medicine log shows when the next paracetamol dose is allowed', async ({ page }) => {
  const errors = trackErrors(page);
  await openWithChild(page, 'dosage');
  const log = page.getByRole('region', { name: /Medicine log/ });
  await log.getByLabel('Medicine').selectOption('Paracetamol');
  await log.getByRole('button', { name: 'Record Dose' }).click();
  await expect(log.getByText(/Next dose not before/)).toBeVisible();
  await expect(log.getByText('1 of 4 doses in the last 24 hours')).toBeVisible();
  // General information only: no child-specific dose is ever suggested.
  await expect(page.getByText(/mg\/kg/)).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('a growth measurement is plotted with a WHO percentile', async ({ page }) => {
  await openWithChild(page, 'growth');
  await page.getByLabel('Date measured').fill('2026-03-15');
  await page.getByLabel('Weight (kg)').fill('7.6');
  await page.getByRole('button', { name: 'Save Measurement' }).click();
  await expect(page.getByText(/Latest: 7.6 kg .* percentile/)).toBeVisible();

  await page.getByLabel('Weight (kg)').fill('900');
  await page.getByRole('button', { name: 'Save Measurement' }).click();
  await expect(page.getByText(/Please check the weight/)).toBeVisible();
});

test('a second child can be added and records stay separate', async ({ page }) => {
  await openWithChild(page, 'growth');
  await page.getByLabel('Weight (kg)').fill('8');
  await page.getByRole('button', { name: 'Save Measurement' }).click();
  await expect(page.getByText(/Latest: 8 kg/)).toBeVisible();

  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('pedipulse_children')!);
    state.children.push({ id: 'c2', name: 'Leo', dob: '2024-01-10', sex: 'Male', medications: [], previousMedications: [], allergies: [] });
    state.activeId = 'c2';
    localStorage.setItem('pedipulse_children', JSON.stringify(state));
  });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Growth – Leo' })).toBeVisible();
  await expect(page.getByText(/Latest:/)).toHaveCount(0);
});

test('conversation starters list the answers without a score', async ({ page }) => {
  await openWithChild(page, 'screening');
  await expect(page.getByRole('heading', { name: 'Conversation Starters' })).toBeVisible();
  await expect(page.getByText(/score/i)).toHaveCount(1); // only "They aren't tests and don't give a score."
});

test('an encrypted backup file can be saved', async ({ page }) => {
  await openWithChild(page, 'ethics');
  const form = page.locator('form').filter({ has: page.getByRole('button', { name: 'Save Backup File' }) });
  const passwords = form.locator('input[type=password]');
  await passwords.nth(0).fill('correct horse');
  await passwords.nth(1).fill('correct horse');
  const download = page.waitForEvent('download');
  await form.getByRole('button', { name: 'Save Backup File' }).click();
  expect((await download).suggestedFilename()).toMatch(/^pedipulse-backup-.*\.json$/);
});
