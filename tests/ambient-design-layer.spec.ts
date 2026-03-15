import { expect, test, type Page } from '@playwright/test';

async function waitForAmbientDesignReady(page: Page) {
  await page.waitForFunction(() => {
    const layer = document.querySelector('[data-testid="ambient-design-layer"]');

    return !layer || layer.getAttribute('data-scene-state') === 'ready';
  });
}

test('renders the ambient host without blocking the resume content', async ({
  page,
}) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await waitForAmbientDesignReady(page);

  const host = page.getByTestId('ambient-design-layer');

  await expect(host).toHaveClass(/hidden-for-media-print/);
  await expect(host).toHaveCSS('pointer-events', 'none');
  await expect(page.getByTestId('app')).toBeVisible();
  await expect(page.getByTestId('ambient-design-canvas')).toBeVisible();
});

test('mounts the scene immediately', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  await expect(page.getByTestId('ambient-design-canvas')).toHaveCount(1);
});

test('switches to static rendering for reduced motion users', async ({
  page,
}) => {
  await page.emulateMedia({
    reducedMotion: 'reduce',
  });
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await waitForAmbientDesignReady(page);

  await expect(page.getByTestId('ambient-design-layer')).toHaveAttribute(
    'data-motion-mode',
    'reduce'
  );
  await expect(page.getByTestId('ambient-design-canvas')).toHaveAttribute(
    'data-animation-mode',
    'static'
  );
});

test('uses a full-bleed page shell on small screen viewports', async ({
  page,
}) => {
  await page.setViewportSize({ width: 639, height: 900 });
  await page.emulateMedia({
    media: 'screen',
    reducedMotion: 'reduce',
  });
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await waitForAmbientDesignReady(page);

  const pageShell = page.getByTestId('app');

  await expect(pageShell).toHaveCSS('box-shadow', 'none');
  await expect(pageShell).toHaveCSS('margin-top', '0px');
  await expect(pageShell).toHaveCSS('margin-bottom', '0px');
  await expect(pageShell).toHaveCSS('max-width', 'none');

  const { shellWidth, viewportWidth } = await page.evaluate(() => {
    const shell = document.querySelector('[data-testid="app"]');

    if (!(shell instanceof HTMLElement)) {
      throw new Error('Expected page shell to be present.');
    }

    return {
      shellWidth: Math.round(shell.getBoundingClientRect().width),
      viewportWidth: document.documentElement.clientWidth,
    };
  });

  expect(shellWidth).toBe(viewportWidth);
});

test('stays out of print rendering', async ({ page }) => {
  await page.emulateMedia({
    media: 'print',
    reducedMotion: 'reduce',
  });
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await waitForAmbientDesignReady(page);

  const host = page.getByTestId('ambient-design-layer');

  await expect(host).toHaveClass(/hidden-for-media-print/);
  await expect(host).toHaveCSS('display', 'none');
});
