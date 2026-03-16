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

async function scrollHeaderIntoStickyRange(page: Page) {
  await page.evaluate(() => {
    const header = document.querySelector('[data-testid="page-header"]');

    if (!(header instanceof HTMLElement)) {
      throw new Error('Expected page header to be present.');
    }

    const { bottom } = header.getBoundingClientRect();

    window.scrollTo(0, Math.max(window.scrollY + bottom + 8, 0));
  });
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
    const headerAfterStyle = getComputedStyle(header, '::after');
    const titleStyle = getComputedStyle(title);

    return {
      header: {
        afterContent: headerAfterStyle.content,
        afterHeight: headerAfterStyle.height,
        afterOpacity: headerAfterStyle.opacity,
        backgroundColor: headerStyle.backgroundColor,
        bottom: headerStyle.bottom,
        boxShadow: headerStyle.boxShadow,
        dataStuck: header.getAttribute('data-stuck'),
        height: headerRect.height,
        paddingTop: headerStyle.paddingTop,
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
        position: titleStyle.position,
        rectTop: titleRect.top,
        stickyPosition: title.getAttribute('data-sticky-position'),
        paddingTop: titleStyle.paddingTop,
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

test('keeps the page header sticky while section titles remain in normal flow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await gotoResume(page);
  const beforeScrollMetrics = await getStickyMetrics(page);

  expect(beforeScrollMetrics.header.dataStuck).not.toBe('true');
  expect(beforeScrollMetrics.header.boxShadow).toBe('none');
  expect(beforeScrollMetrics.title.stickyPosition).toBeNull();
  expect(beforeScrollMetrics.title.position).toBe('static');

  await scrollHeaderIntoStickyRange(page);

  await expect
    .poll(async () => Math.abs((await getStickyMetrics(page)).header.rectTop))
    .toBeLessThan(1.5);
  await expect
    .poll(async () => (await getStickyMetrics(page)).header.dataStuck)
    .toBe('true');

  const initialMetrics = await getStickyMetrics(page);
  const initialScrollY = await page.evaluate(() => window.scrollY);

  expect(initialMetrics.header.stickyPosition).toBe('top');
  expect(initialMetrics.header.dataStuck).toBe('true');
  expect(initialMetrics.header.boxShadow).toBe('none');
  expect(initialMetrics.header.afterContent).not.toBe('none');
  expect(initialMetrics.header.afterHeight).not.toBe('0px');
  expect(initialMetrics.header.afterOpacity).not.toBe('0');
  expect(initialScrollY).toBeGreaterThan(0);
  expect(initialMetrics.header.rectTop).toBeCloseTo(0, 1);
  expect(initialMetrics.header.height).toBeGreaterThan(0);
  expect(initialMetrics.header.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  expect(initialMetrics.title.stickyPosition).toBeNull();
  expect(initialMetrics.title.dataStuck).not.toBe('true');
  expect(initialMetrics.title.position).toBe('static');
  expect(initialMetrics.title.boxShadow).toBe('none');

  await page.setViewportSize({ width: 639, height: 900 });
  await scrollHeaderIntoStickyRange(page);

  await expect
    .poll(async () => (await getStickyMetrics(page)).header.dataStuck)
    .toBe('true');

  const resizedMetrics = await getStickyMetrics(page);
  const resizedScrollY = await page.evaluate(() => window.scrollY);

  expect(resizedMetrics.header.dataStuck).toBe('true');
  expect(resizedScrollY).toBeGreaterThan(0);
  expect(resizedMetrics.title.stickyPosition).toBeNull();
  expect(resizedMetrics.title.position).toBe('static');
});

test('neutralizes sticky styles in print', async ({ page }) => {
  await gotoResume(page, 'print');

  const metrics = await getStickyMetrics(page);

  expect(metrics.header.stickyPosition).toBe('top');
  expect(metrics.header.dataStuck).not.toBe('true');
  expect(metrics.header.position).toBe('static');
  expect(metrics.header.top).toBe('auto');
  expect(metrics.header.bottom).toBe('auto');
  expect(metrics.header.boxShadow).toBe('none');
  expect(metrics.header.zIndex).toBe('auto');
  expect(['rgba(0, 0, 0, 0)', 'transparent']).toContain(metrics.header.backgroundColor);
  expect(metrics.title.stickyPosition).toBeNull();
  expect(metrics.title.dataStuck).not.toBe('true');
  expect(metrics.title.position).toBe('static');
  expect(metrics.title.top).toBe('auto');
  expect(metrics.title.bottom).toBe('auto');
  expect(metrics.title.boxShadow).toBe('none');
  expect(metrics.title.zIndex).toBe('auto');
  expect(['rgba(0, 0, 0, 0)', 'transparent']).toContain(metrics.title.backgroundColor);
});
