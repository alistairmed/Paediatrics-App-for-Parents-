import { Page } from '@playwright/test';

export const CHILD = { id: 'c1', name: 'Mia', dob: '2025-09-15', sex: 'Female', medications: [], previousMedications: [], allergies: [] };

/** Opens the app as a returning parent with one child and the disclaimer already accepted. */
export async function openWithChild(page: Page, view = 'dashboard') {
  // Seed storage before the app's own scripts run, once per tab, so reloads keep later changes.
  await page.addInitScript(child => {
    if (sessionStorage.getItem('e2e_seeded')) return;
    sessionStorage.setItem('e2e_seeded', '1');
    localStorage.clear();
    localStorage.setItem('pedipulse_disclaimer_accepted', 'true');
    localStorage.setItem('pedipulse_children', JSON.stringify({ activeId: child.id, children: [child] }));
  }, CHILD);
  await page.goto(`/#/${view}`);
}

/** Collects uncaught page errors so a test can assert there were none. */
export function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  return errors;
}
