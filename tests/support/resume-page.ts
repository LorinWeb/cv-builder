import type { Page } from '@playwright/test';

export async function waitForAmbientDesignReady(page: Page) {
  await page.waitForFunction(() => {
    const layer = document.querySelector('[data-testid="ambient-design-layer"]');

    return !layer || layer.getAttribute('data-scene-state') === 'ready';
  });
}

export async function gotoResume(
  page: Page,
  media: 'print' | 'screen' = 'screen'
) {
  await page.emulateMedia({
    media,
    reducedMotion: 'reduce',
  });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await waitForAmbientDesignReady(page);
  await page.waitForTimeout(200);
}
