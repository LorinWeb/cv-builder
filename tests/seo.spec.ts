import { expect, test } from '@playwright/test';

import { loadResumeData } from '../src/data/load-resume-data';
import { getDocumentTitle, getMetaDescription } from '../src/helpers/seo';

const resumeData = loadResumeData({
  mode: 'test',
});

test('exposes the build-time document title', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  await expect(page).toHaveTitle(getDocumentTitle(resumeData));
});

test('exposes the build-time meta description', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  const metaDescription = page.locator('meta[name="description"]');

  await expect(metaDescription).toHaveCount(1);
  await expect(metaDescription).toHaveAttribute('content', getMetaDescription(resumeData));
});

test('serves a valid robots file', async ({ request }) => {
  const response = await request.get('/robots.txt');

  expect(response.ok()).toBeTruthy();
  expect(await response.text()).toBe('User-agent: *\nAllow: /\n');
});
