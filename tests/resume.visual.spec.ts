import { expect, test } from '@playwright/test';

import { gotoResume } from './support/resume-page';

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
