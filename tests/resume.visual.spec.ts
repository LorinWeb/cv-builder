import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

async function gotoResume(page: Page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.waitForTimeout(200);
}

test('matches the current screen rendering', async ({ page }) => {
  await gotoResume(page);

  await expect(page).toHaveScreenshot('resume-screen.png', {
    animations: 'disabled',
    caret: 'hide',
    fullPage: true,
    scale: 'css',
  });
});

test('matches the current print rendering', async ({ page }) => {
  await page.emulateMedia({ media: 'print' });
  await gotoResume(page);

  await expect(page).toHaveScreenshot('resume-print.png', {
    animations: 'disabled',
    caret: 'hide',
    fullPage: true,
    scale: 'css',
  });
});
