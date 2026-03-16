import { expect, test } from '@playwright/test';

import {
  DEFAULT_RESUME_DATA_PATH,
  RESUME_DATA_PATH_ENV_VAR,
} from '../src/data/resume-data-paths';
import { loadResumeData } from '../src/data/load-resume-data';
import { getDocumentTitle } from '../src/helpers/seo';

process.env[RESUME_DATA_PATH_ENV_VAR] = DEFAULT_RESUME_DATA_PATH;

const resumeData = loadResumeData({
  mode: 'test',
});

function getExpectedDescription(summary: string): string {
  const normalizedSummary = summary.replace(/\s+/g, ' ').trim();
  const firstSentence = normalizedSummary.match(/^[^.]*\./)?.[0];

  return firstSentence ? firstSentence.trim() : normalizedSummary;
}

test('exposes the build-time document title', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  await expect(page).toHaveTitle(getDocumentTitle(resumeData));
});

test('exposes the build-time meta description', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  const expectedDescription = getExpectedDescription(
    resumeData.basics?.summary ?? ''
  );
  const metaDescription = page.locator('meta[name="description"]');

  await expect(metaDescription).toHaveCount(1);
  await expect(metaDescription).toHaveAttribute('content', expectedDescription);
});

test('serves a valid robots file', async ({ request }) => {
  const response = await request.get('/robots.txt');

  expect(response.ok()).toBeTruthy();
  expect(await response.text()).toBe('User-agent: *\nAllow: /\n');
});
