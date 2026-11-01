import { test, expect } from '@playwright/test';
import { CHILD } from './helpers';

test('milestones use plain wording, update old saved items and keep the parent\'s notes', async ({ page }) => {
  // A child whose saved milestones still have the old "Red Flag:" text.
  await page.addInitScript(child => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem('pedipulse_disclaimer_accepted', 'true');
    localStorage.setItem('pedipulse_children', JSON.stringify({ activeId: child.id, children: [child] }));
    localStorage.setItem(`pedipulse_history:${child.id}`, JSON.stringify({
      milestones: [{ id: '6w-rf3', ageRange: '6-8 Weeks', category: 'Social', description: 'Red Flag: No social smile by 8 weeks. Example: old.', completed: false, isRedFlag: true, notes: 'Ask at the check' }],
    }));
  }, CHILD);
  await page.goto('/#/milestones');

  await page.getByRole('button', { name: 'Things to Discuss' }).click();
  await expect(page.getByText('No social smile by 8 weeks', { exact: true })).toBeVisible();
  await expect(page.getByText('Ask at the check')).toBeVisible();
  const text = await page.locator('main').innerText();
  expect(text).not.toMatch(/red flag|urgent|clinical action|clinical consensus|requiring urgent/i);

  await page.getByRole('button', { name: 'Mark "No social smile by 8 weeks. Example: Does not smile back at caregivers." as done' }).click();
  await page.goto('/#/redbook');
  await expect(page.getByText('Things to discuss')).toBeVisible();
  await expect(page.getByText(/You've noted 1 item on the milestones page/)).toBeVisible();
});
