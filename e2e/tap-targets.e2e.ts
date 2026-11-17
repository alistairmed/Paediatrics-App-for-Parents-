import { test, expect, Page } from '@playwright/test';
import { openWithChild } from './helpers';

/** Visible controls that are smaller than 44px in either direction. A checkbox inside a label counts as the label. */
async function smallControls(page: Page) {
  return page.evaluate(() => {
    const out: string[] = [];
    document.querySelectorAll('button, a[href], input, select, textarea, [role=tab]').forEach(el => {
      const input = el as HTMLInputElement;
      if (input.type === 'file' || input.type === 'hidden') return;
      const target = (input.type === 'checkbox' || input.type === 'radio') ? (el.closest('label') || el) : el;
      const r = target.getBoundingClientRect();
      const s = getComputedStyle(el);
      if (r.width === 0 || r.height === 0 || s.visibility === 'hidden') return;
      if (r.width < 44 || r.height < 44) out.push(`${el.tagName} "${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30)}" ${Math.round(r.width)}x${Math.round(r.height)}`);
    });
    return out;
  });
}

test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

test('Buttons and links are at least 44px: header, growth tabs, helplines, backup, passcode, delete, chips, tabs, checkboxes, inputs', async ({ page }) => {
  for (const view of ['dashboard', 'symptoms', 'growth', 'ethics', 'acutelogs', 'parenting', 'vaccines', 'appointments', 'handover', 'developmental', 'sickday']) {
    await openWithChild(page, view);
    await page.waitForTimeout(300);
    expect(await smallControls(page), view).toEqual([]);
  }
});
