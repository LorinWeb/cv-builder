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

async function scrollStandalonePhotoOutOfView(page: Page) {
  await page.evaluate(() => {
    const standalonePhoto = document.querySelector(
      '[data-testid="profile-photo-standalone"]'
    );

    if (!(standalonePhoto instanceof HTMLElement)) {
      throw new Error('Expected standalone profile photo to be present.');
    }

    const { bottom } = standalonePhoto.getBoundingClientRect();

    window.scrollTo(0, Math.max(window.scrollY + bottom + 8, 0));
  });
}

async function getProfilePhotoMetrics(page: Page) {
  return page.evaluate(() => {
    const standaloneFrame = document.querySelector(
      '[data-testid="profile-photo-standalone-frame"]'
    );
    const standalonePhoto = document.querySelector(
      '[data-testid="profile-photo-standalone"]'
    );
    const pageElement = document.querySelector('[data-testid="app"]');
    const header = document.querySelector('[data-testid="page-header"]');
    const intro = document.querySelector('[data-testid="profile-intro"]');
    const contacts = document.querySelector('[data-testid="profile-contacts"]');
    const compactPhoto = document.querySelector('[data-testid="profile-photo-compact"]');
    const compactPhotoElement =
      compactPhoto instanceof HTMLElement ? compactPhoto : null;

    if (
      !(standaloneFrame instanceof HTMLElement) ||
      !(standalonePhoto instanceof HTMLImageElement) ||
      !(pageElement instanceof HTMLElement) ||
      !(header instanceof HTMLElement) ||
      !(intro instanceof HTMLElement) ||
      !(contacts instanceof HTMLElement)
    ) {
      throw new Error('Expected profile photo layout elements to be present.');
    }

    const standaloneFrameRect = standaloneFrame.getBoundingClientRect();
    const standalonePhotoRect = standalonePhoto.getBoundingClientRect();
    const pageRect = pageElement.getBoundingClientRect();
    const headerRect = header.getBoundingClientRect();
    const introRect = intro.getBoundingClientRect();
    const contactsRect = contacts.getBoundingClientRect();
    const compactPhotoRect = compactPhotoElement?.getBoundingClientRect() ?? null;

    return {
      compactPhoto: compactPhotoRect
        ? {
            dataVisible: compactPhotoElement?.getAttribute('data-visible'),
            bottom: compactPhotoRect.bottom,
            height: compactPhotoRect.height,
            left: compactPhotoRect.left,
            right: compactPhotoRect.right,
            top: compactPhotoRect.top,
            width: compactPhotoRect.width,
          }
        : null,
      contacts: {
        bottom: contactsRect.bottom,
        left: contactsRect.left,
        top: contactsRect.top,
      },
      header: {
        bottom: headerRect.bottom,
        dataStuck: header.getAttribute('data-stuck'),
        left: headerRect.left,
        right: headerRect.right,
        top: headerRect.top,
      },
      intro: {
        bottom: introRect.bottom,
        left: introRect.left,
        right: introRect.right,
        top: introRect.top,
      },
      page: {
        centerX: pageRect.left + pageRect.width / 2,
        top: pageRect.top,
      },
      standaloneFrame: {
        centerX: standaloneFrameRect.left + standaloneFrameRect.width / 2,
      },
      standalonePhoto: {
        bottom: standalonePhotoRect.bottom,
        centerX: standalonePhotoRect.left + standalonePhotoRect.width / 2,
        height: standalonePhotoRect.height,
        left: standalonePhotoRect.left,
        right: standalonePhotoRect.right,
        top: standalonePhotoRect.top,
        width: standalonePhotoRect.width,
      },
    };
  });
}

test('renders the standalone photo centered above the page before the header compacts', async ({
  page,
}) => {
  await gotoResume(page);

  const standalonePhoto = page.getByTestId('profile-photo-standalone');

  await expect(standalonePhoto).toBeVisible();
  await expect(standalonePhoto).toHaveAttribute('src', '/static/profile-placeholder.jpg');
  await expect(standalonePhoto).toHaveAttribute(
    'alt',
    /recommended profile photo crop/i
  );
  await expect(page.getByTestId('profile-photo-compact')).toHaveAttribute(
    'data-visible',
    'false'
  );

  const metrics = await getProfilePhotoMetrics(page);

  expect(
    Math.abs(metrics.standaloneFrame.centerX - metrics.page.centerX)
  ).toBeLessThanOrEqual(2);
  expect(metrics.standalonePhoto.bottom).toBeLessThan(metrics.page.top);
  expect(Math.abs(metrics.standalonePhoto.height - metrics.standalonePhoto.width)).toBeLessThanOrEqual(
    2
  );
  expect(Math.abs(metrics.intro.left - metrics.contacts.left)).toBeLessThanOrEqual(2);
});

test('snaps the compact photo into the sticky header once the standalone photo has scrolled away', async ({
  page,
}) => {
  await gotoResume(page);

  const initialMetrics = await getProfilePhotoMetrics(page);

  await scrollStandalonePhotoOutOfView(page);

  await expect
    .poll(async () => (await getProfilePhotoMetrics(page)).compactPhoto?.dataVisible)
    .toBe('true');
  const compactMetrics = await getProfilePhotoMetrics(page);

  expect(compactMetrics.compactPhoto).not.toBeNull();

  if (!compactMetrics.compactPhoto) {
    throw new Error('Expected compact profile photo to be present.');
  }

  expect(compactMetrics.compactPhoto.height).toBeLessThan(initialMetrics.standalonePhoto.height);
  expect(compactMetrics.compactPhoto.width).toBeLessThan(initialMetrics.standalonePhoto.width);
  expect(compactMetrics.compactPhoto.top).toBeGreaterThanOrEqual(
    compactMetrics.header.top - 1
  );
  expect(compactMetrics.compactPhoto.bottom).toBeLessThanOrEqual(
    compactMetrics.header.bottom + 1
  );
  expect(compactMetrics.intro.left).toBeGreaterThan(compactMetrics.compactPhoto.right - 1);
  expect(compactMetrics.contacts.top).toBeGreaterThanOrEqual(
    Math.max(compactMetrics.compactPhoto.bottom, compactMetrics.intro.bottom) - 1
  );

  await page.evaluate(() => {
    window.scrollTo(0, 0);
  });

  await expect
    .poll(async () => (await getProfilePhotoMetrics(page)).compactPhoto?.dataVisible)
    .toBe('false');
});

test('keeps the standalone photo on mobile and in print while leaving the compact photo as a screen-only state', async ({
  page,
}) => {
  await page.setViewportSize({ width: 639, height: 900 });
  await gotoResume(page);

  const mobileMetrics = await getProfilePhotoMetrics(page);

  expect(
    Math.abs(mobileMetrics.standalonePhoto.centerX - mobileMetrics.standaloneFrame.centerX)
  ).toBeLessThanOrEqual(2);
  expect(mobileMetrics.standalonePhoto.bottom).toBeLessThan(mobileMetrics.page.top);

  await scrollStandalonePhotoOutOfView(page);

  await expect
    .poll(async () => (await getProfilePhotoMetrics(page)).compactPhoto?.dataVisible)
    .toBe('true');

  await gotoResume(page, 'print');

  await expect(page.getByTestId('profile-photo-standalone-frame')).toBeHidden();
  await expect(page.getByTestId('profile-photo-compact')).toBeHidden();
});
