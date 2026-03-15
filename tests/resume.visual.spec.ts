import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

async function gotoResume(page: Page, media: 'print' | 'screen' = 'screen') {
  await page.emulateMedia({
    media,
    reducedMotion: 'reduce',
  });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.waitForFunction(() => {
    const layer = document.querySelector('[data-testid="ambient-design-layer"]');

    return !layer || layer.getAttribute('data-scene-state') === 'ready';
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
  await gotoResume(page, 'print');

  await expect(page).toHaveScreenshot('resume-print.png', {
    animations: 'disabled',
    caret: 'hide',
    fullPage: true,
    scale: 'css',
  });
});
