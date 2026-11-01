import { test, expect } from '@playwright/test';
import { openWithChild, trackErrors } from './helpers';

test('medicine page records doses without giving dosing rules', async ({ page }) => {
  const errors = trackErrors(page);
  await openWithChild(page, 'dosage');
  const log = page.getByRole('region', { name: /Medicine log/ });
  await log.getByLabel('Medicine').selectOption('Paracetamol');
  await log.getByRole('button', { name: 'Record Dose' }).click();
  await expect(log.getByText(/Last recorded at/)).toBeVisible();
  await expect(log.getByText('1 dose recorded in the last 24 hours')).toBeVisible();
  // General information only: no amounts, frequencies or maximums.
  await expect(page.getByText('Check the product label and ask your pharmacist or doctor.')).toBeVisible();
  const info = await page.locator('main').innerText();
  expect(info).not.toMatch(/mg\/kg|times in 24 hours|hours apart|next dose|how much to give/i);
  expect(errors).toEqual([]);
});

test('a growth measurement is plotted with a WHO percentile', async ({ page }) => {
  await openWithChild(page, 'growth');
  await page.getByLabel('Date measured').fill('2026-03-15');
  await page.getByLabel('Weight (kg)').fill('7.6');
  await page.getByRole('button', { name: 'Save Measurement' }).click();
  await expect(page.getByText(/Latest: 7.6 kg .* percentile/)).toBeVisible();
  await page.getByLabel('Date measured').fill('2026-06-15');
  await page.getByLabel('Weight (kg)').fill('8.4');
  await page.getByLabel('Length or height (cm)').fill('70');
  await page.getByRole('button', { name: 'Save Measurement' }).click();
  const table = page.getByRole('region', { name: 'All measurements with WHO percentiles' });
  await expect(table.getByRole('row')).toHaveCount(3); // header + 2 measurements
  await expect(table.getByText(/percentile/)).toHaveCount(3); // 2 weights + 1 length
  await expect(page.getByText('Percentiles are for information. Discuss growth concerns with your GP or child health nurse.')).toBeVisible();

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

test('a backup can be restored after the records change, with a confirmation first', async ({ page }) => {
  await openWithChild(page, 'ethics');
  const save = page.locator('form').filter({ has: page.getByRole('button', { name: 'Save Backup File' }) });
  await save.getByLabel(/Backup password/).fill('correct horse battery');
  await save.getByLabel('Repeat password').fill('correct horse battery');
  const download = page.waitForEvent('download');
  await save.getByRole('button', { name: 'Save Backup File' }).click();
  const backupPath = await (await download).path();

  // Change the records after the backup was made.
  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('pedipulse_children')!);
    state.children[0].name = 'Changed';
    localStorage.setItem('pedipulse_children', JSON.stringify(state));
  });
  await page.reload();

  const restore = page.locator('form').filter({ has: page.getByRole('heading', { name: 'Restore a backup' }) });
  await restore.locator('input[type=file]').setInputFiles(backupPath);

  await restore.getByLabel('Backup password').fill('wrong passphrase');
  await restore.getByRole('button', { name: 'Restore Backup' }).click();
  await expect(restore.getByRole('alert')).toHaveText("That password doesn't open this backup.");

  await restore.getByLabel('Backup password').fill('correct horse battery');
  await restore.getByRole('button', { name: 'Restore Backup' }).click();
  const dialog = page.getByRole('alertdialog').or(page.getByRole('dialog'));
  await expect(dialog.getByText(/This replaces all records on this device/)).toBeVisible();
  await dialog.getByRole('button', { name: 'Restore' }).click();

  await page.waitForLoadState('load');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('pedipulse_children')!).children[0].name)).toBe('Mia');
});

