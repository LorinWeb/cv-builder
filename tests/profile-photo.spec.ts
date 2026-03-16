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
    const header = document.querySelector('[data-testid="page-header"]');

    if (!(standalonePhoto instanceof HTMLElement) || !(header instanceof HTMLElement)) {
      throw new Error('Expected standalone profile photo and page header to be present.');
    }

    const standalonePhotoBottom = standalonePhoto.getBoundingClientRect().bottom;
    const headerBottom = header.getBoundingClientRect().bottom;

    window.scrollTo(
      0,
      Math.max(
        window.scrollY + Math.max(standalonePhotoBottom, headerBottom) + window.innerHeight,
        0
      )
    );
  });
}

async function getProfilePhotoMetrics(page: Page) {
  return page.evaluate(() => {
    const stickyHeaderRoot = document.querySelector('.PageHeaderPortalRoot');
    const standaloneFrame = document.querySelector(
      '[data-testid="profile-photo-standalone-frame"]'
    );
    const standalonePhoto = document.querySelector(
      '[data-testid="profile-photo-standalone"]'
    );
    const pageElement = document.querySelector('[data-testid="app"]');
    const header =
      stickyHeaderRoot?.querySelector('[data-testid="page-header"]') ||
      document.querySelector('[data-testid="page-header"][data-stuck="true"]') ||
      document.querySelector('[data-testid="page-header"]');
    const intro = document.querySelector('[data-testid="profile-intro"]');
    const contacts = document.querySelector('[data-testid="profile-contacts"]');
    const compactPhoto =
      stickyHeaderRoot?.querySelector('[data-testid="profile-photo-compact"]') ||
      document.querySelector(
        '[data-testid="page-header"][data-stuck="true"] [data-testid="profile-photo-compact"]'
      ) ||
      document.querySelector('[data-testid="profile-photo-compact"]');
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
  expect(metrics.header.top - metrics.standalonePhoto.bottom).toBeGreaterThanOrEqual(24);
  expect(Math.abs(metrics.standalonePhoto.height - metrics.standalonePhoto.width)).toBeLessThanOrEqual(
    2
  );
  expect(Math.abs(metrics.intro.left - metrics.contacts.left)).toBeLessThanOrEqual(2);
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
  expect(mobileMetrics.standalonePhoto.bottom).toBeLessThanOrEqual(mobileMetrics.page.top);

  await scrollStandalonePhotoOutOfView(page);

  await expect
    .poll(async () => (await getProfilePhotoMetrics(page)).compactPhoto?.width ?? 0)
    .toBeGreaterThan(0);

  await gotoResume(page, 'print');

  await expect(page.getByTestId('profile-photo-standalone-frame')).toBeHidden();
  await expect(page.getByTestId('profile-photo-compact')).toBeHidden();
});
