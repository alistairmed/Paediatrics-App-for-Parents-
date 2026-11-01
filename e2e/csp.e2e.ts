import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { openWithChild } from './helpers';

// Serve pages with the production Content-Security-Policy from vercel.json so
// anything that needs a blocked script or inline style fails here, not in production.
const vercel = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
const CSP: string = vercel.headers[0].headers.find((h: { key: string }) => h.key === 'Content-Security-Policy').value;

const VIEWS = ['dashboard', 'growth', 'vaccines', 'dosage', 'summary', 'milestones', 'ethics', 'setup'];

test.beforeEach(async ({ page }) => {
  await page.route('**/*', async route => {
    if (route.request().resourceType() !== 'document') return route.continue();
    const response = await route.fetch();
    await route.fulfill({ response, headers: { ...response.headers(), 'content-security-policy': CSP } });
  });
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', e => {
      ((window as any).__csp ||= []).push(`${e.violatedDirective} ${e.blockedURI}`);
    });
  });
});

test('the production CSP has no unsafe-inline', () => {
  expect(CSP).not.toContain('unsafe-inline');
});

for (const view of VIEWS) {
  test(`${view} works under the production CSP`, async ({ page }) => {
    await openWithChild(page, view);
    await expect(page.getByRole('heading').first()).toBeVisible();
    expect(await page.evaluate(() => (window as any).__csp || [])).toEqual([]);
  });
}
