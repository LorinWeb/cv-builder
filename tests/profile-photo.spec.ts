import { expect, test, type Page } from '@playwright/test';

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

test('renders the placeholder photo centered above the profile content', async ({
  page,
}) => {
  await gotoResume(page);

  const photo = page.getByTestId('profile-photo');

  await expect(photo).toBeVisible();
  await expect(photo).toHaveAttribute('src', '/static/profile-placeholder.jpg');
  await expect(photo).toHaveAttribute(
    'alt',
    /recommended profile photo crop/i
  );

  const layout = await page.evaluate(() => {
    const photoElement = document.querySelector('[data-testid="profile-photo"]');
    const profileSection = document.querySelector('[data-testid="profile-section"]');
    const heading = document.querySelector('[data-testid="profile-section"] h1');

    if (
      !(photoElement instanceof HTMLImageElement) ||
      !(profileSection instanceof HTMLElement) ||
      !(heading instanceof HTMLElement)
    ) {
      throw new Error('Expected profile photo layout elements to be present.');
    }

    const photoRect = photoElement.getBoundingClientRect();
    const sectionRect = profileSection.getBoundingClientRect();
    const headingRect = heading.getBoundingClientRect();

    return {
      headingTop: headingRect.top,
      photoBottom: photoRect.bottom,
      photoCenterX: photoRect.left + photoRect.width / 2,
      photoHeight: photoRect.height,
      photoWidth: photoRect.width,
      sectionCenterX: sectionRect.left + sectionRect.width / 2,
    };
  });

  expect(Math.abs(layout.photoCenterX - layout.sectionCenterX)).toBeLessThanOrEqual(2);
  expect(layout.photoBottom).toBeLessThan(layout.headingTop);
  expect(layout.photoHeight).toBeGreaterThan(layout.photoWidth);
});

test('keeps the profile photo visible on mobile and in print', async ({ page }) => {
  await page.setViewportSize({ width: 639, height: 900 });
  await gotoResume(page);

  const mobileMetrics = await page.evaluate(() => {
    const photoElement = document.querySelector('[data-testid="profile-photo"]');
    const profileSection = document.querySelector('[data-testid="profile-section"]');

    if (
      !(photoElement instanceof HTMLImageElement) ||
      !(profileSection instanceof HTMLElement)
    ) {
      throw new Error('Expected profile photo layout elements to be present.');
    }

    const photoRect = photoElement.getBoundingClientRect();
    const sectionRect = profileSection.getBoundingClientRect();

    return {
      photoBottom: photoRect.bottom,
      photoTop: photoRect.top,
      sectionBottom: sectionRect.bottom,
      sectionTop: sectionRect.top,
    };
  });

  expect(mobileMetrics.photoTop).toBeGreaterThanOrEqual(mobileMetrics.sectionTop);
  expect(mobileMetrics.photoBottom).toBeLessThanOrEqual(mobileMetrics.sectionBottom);

  await gotoResume(page, 'print');

  const printPhoto = page.getByTestId('profile-photo');

  await expect(printPhoto).toBeVisible();
  await expect(printPhoto).toHaveAttribute('src', '/static/profile-placeholder.jpg');
});
