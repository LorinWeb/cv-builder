import { expect, test, type Page } from '@playwright/test';

import { getStickyStyle, normalizeStickyConfig } from '../src/components/Layout/sticky';

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

async function scrollSectionTitleIntoStickyRange(page: Page, sectionTestId: string) {
  await page.evaluate((currentSectionTestId) => {
    const title = document.querySelector(
      `[data-testid="${currentSectionTestId}"] [data-testid="section-title"]`
    );

    if (!(title instanceof HTMLElement)) {
      throw new Error(`Expected section title for ${currentSectionTestId} to be present.`);
    }

    const titleStyle = getComputedStyle(title);
    const marginTop = parseFloat(titleStyle.marginTop) || 0;
    const stickyOffset = parseFloat(titleStyle.top) || 0;
    const titleTop = title.getBoundingClientRect().top + window.scrollY;

    window.scrollTo(0, Math.max(titleTop - (stickyOffset - marginTop) + 8, 0));
  }, sectionTestId);
}

async function getStickyMetrics(
  page: Page,
  sectionTestId = 'resume-section-professional-summary'
) {
  return page.evaluate((currentSectionTestId) => {
    const header = document.querySelector('[data-testid="page-header"]');
    const title = document.querySelector(
      `[data-testid="${currentSectionTestId}"] [data-testid="section-title"]`
    );

    if (!(header instanceof HTMLElement)) {
      throw new Error('Expected page header to be present.');
    }

    if (!(title instanceof HTMLElement)) {
      throw new Error('Expected summary section title to be present.');
    }

    const headerRect = header.getBoundingClientRect();
    const titleRect = title.getBoundingClientRect();
    const headerStyle = getComputedStyle(header);
    const titleStyle = getComputedStyle(title);

    return {
      header: {
        backgroundColor: headerStyle.backgroundColor,
        bottom: headerStyle.bottom,
        boxShadow: headerStyle.boxShadow,
        dataStuck: header.getAttribute('data-stuck'),
        height: headerRect.height,
        rectBottom: headerRect.bottom,
        rectTop: headerRect.top,
        stickyPosition: header.getAttribute('data-sticky-position'),
        top: headerStyle.top,
        zIndex: headerStyle.zIndex,
        position: headerStyle.position,
      },
      title: {
        backgroundColor: titleStyle.backgroundColor,
        bottom: titleStyle.bottom,
        boxShadow: titleStyle.boxShadow,
        dataStuck: title.getAttribute('data-stuck'),
        marginTop: titleStyle.marginTop,
        position: titleStyle.position,
        rectTop: titleRect.top,
        stickyPosition: title.getAttribute('data-sticky-position'),
        top: titleStyle.top,
        zIndex: titleStyle.zIndex,
      },
    };
  }, sectionTestId);
}

test('normalizes boolean and configured sticky props', async () => {
  expect(normalizeStickyConfig(false)).toBeNull();
  expect(normalizeStickyConfig(true)).toEqual({
    offset: '0px',
    position: 'top',
  });
  expect(normalizeStickyConfig({ offset: 24, position: 'bottom' })).toEqual({
    offset: '24px',
    position: 'bottom',
  });
  expect(normalizeStickyConfig({ offset: 'var(--sticky-offset)' })).toEqual({
    offset: 'var(--sticky-offset)',
    position: 'top',
  });
});

test('creates sticky styles with the inactive side cleared', async () => {
  expect(
    getStickyStyle(normalizeStickyConfig({ offset: 18, position: 'top' }))
  ).toEqual({
    bottom: 'auto',
    position: 'sticky',
    top: '18px',
  });
  expect(
    getStickyStyle(normalizeStickyConfig({ offset: '2rem', position: 'bottom' }))
  ).toEqual({
    bottom: '2rem',
    position: 'sticky',
    top: 'auto',
  });
});

test('keeps sticky section titles aligned beneath the sticky header and updates on resize', async ({
  page,
}) => {
  const sectionTestId = 'resume-section-professional-experience';

  await page.setViewportSize({ width: 1280, height: 900 });
  await gotoResume(page);
  const beforeScrollMetrics = await getStickyMetrics(page, sectionTestId);

  expect(beforeScrollMetrics.header.dataStuck).not.toBe('true');
  expect(beforeScrollMetrics.header.boxShadow).toBe('none');
  expect(beforeScrollMetrics.title.dataStuck).not.toBe('true');
  expect(beforeScrollMetrics.title.boxShadow).toBe('none');

  await scrollSectionTitleIntoStickyRange(page, sectionTestId);

  await expect
    .poll(async () => Math.abs((await getStickyMetrics(page, sectionTestId)).header.rectTop))
    .toBeLessThan(1.5);
  await expect
    .poll(async () => (await getStickyMetrics(page, sectionTestId)).header.dataStuck)
    .toBe('true');
  await expect
    .poll(async () => (await getStickyMetrics(page, sectionTestId)).title.dataStuck)
    .toBe('true');

  const initialMetrics = await getStickyMetrics(page, sectionTestId);
  const initialScrollY = await page.evaluate(() => window.scrollY);

  expect(initialMetrics.header.position).toBe('sticky');
  expect(initialMetrics.header.stickyPosition).toBe('top');
  expect(initialMetrics.header.dataStuck).toBe('true');
  expect(initialMetrics.header.boxShadow).not.toBe('none');
  expect(initialScrollY).toBeGreaterThan(0);
  expect(parseFloat(initialMetrics.header.top)).toBeCloseTo(0, 1);
  expect(initialMetrics.title.position).toBe('sticky');
  expect(initialMetrics.title.stickyPosition).toBe('top');
  expect(initialMetrics.title.dataStuck).toBe('true');
  expect(initialMetrics.title.boxShadow).not.toBe('none');
  expect(parseFloat(initialMetrics.title.top)).toBeCloseTo(
    initialMetrics.header.height,
    1
  );

  await page.setViewportSize({ width: 639, height: 900 });
  await scrollSectionTitleIntoStickyRange(page, sectionTestId);

  await expect
    .poll(async () => {
      const metrics = await getStickyMetrics(page, sectionTestId);

      return Math.abs(parseFloat(metrics.title.top) - metrics.header.height);
    })
    .toBeLessThan(1.5);
  await expect
    .poll(async () => (await getStickyMetrics(page, sectionTestId)).header.dataStuck)
    .toBe('true');
  await expect
    .poll(async () => (await getStickyMetrics(page, sectionTestId)).title.dataStuck)
    .toBe('true');

  const resizedMetrics = await getStickyMetrics(page, sectionTestId);
  const resizedScrollY = await page.evaluate(() => window.scrollY);

  expect(Math.abs(resizedMetrics.header.height - initialMetrics.header.height)).toBeGreaterThan(
    5
  );
  expect(resizedMetrics.header.dataStuck).toBe('true');
  expect(resizedMetrics.title.dataStuck).toBe('true');
  expect(resizedScrollY).toBeGreaterThan(0);
  expect(parseFloat(resizedMetrics.title.top)).toBeCloseTo(resizedMetrics.header.height, 1);
});

test('neutralizes sticky styles in print', async ({ page }) => {
  await gotoResume(page, 'print');

  const metrics = await getStickyMetrics(page);

  expect(metrics.header.stickyPosition).toBe('top');
  expect(metrics.title.stickyPosition).toBe('top');
  expect(metrics.header.dataStuck).not.toBe('true');
  expect(metrics.header.position).toBe('static');
  expect(metrics.header.top).toBe('auto');
  expect(metrics.header.bottom).toBe('auto');
  expect(metrics.header.boxShadow).toBe('none');
  expect(metrics.header.zIndex).toBe('auto');
  expect(['rgba(0, 0, 0, 0)', 'transparent']).toContain(metrics.header.backgroundColor);
  expect(metrics.title.dataStuck).not.toBe('true');
  expect(metrics.title.position).toBe('static');
  expect(metrics.title.top).toBe('auto');
  expect(metrics.title.bottom).toBe('auto');
  expect(metrics.title.boxShadow).toBe('none');
  expect(metrics.title.zIndex).toBe('auto');
  expect(['rgba(0, 0, 0, 0)', 'transparent']).toContain(metrics.title.backgroundColor);
});
