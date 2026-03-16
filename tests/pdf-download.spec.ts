import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { expect, test } from '@playwright/test';

import { RESUME_PDF_DOWNLOAD_HREF } from '../src/features/pdf-download/constants';
import {
  getProfileContactItems,
  usePdfDownload,
} from '../src/features/pdf-download';
import { gotoResume } from './support/resume-page';

const PROJECT_ROOT = process.cwd();

function getNpmCommand() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

function collectTextFiles(rootDirectory: string) {
  const contents: string[] = [];

  for (const entry of readdirSync(rootDirectory)) {
    const entryPath = path.join(rootDirectory, entry);
    const entryStats = statSync(entryPath);

    if (entryStats.isDirectory()) {
      contents.push(...collectTextFiles(entryPath));
      continue;
    }

    if (!/\.(css|html|js|json|map|txt)$/i.test(entryPath)) {
      continue;
    }

    contents.push(readFileSync(entryPath, 'utf8'));
  }

  return contents;
}

test('returns the expected PDF download state', async () => {
  expect(usePdfDownload()).toEqual({
    href: RESUME_PDF_DOWNLOAD_HREF,
    isAvailable: true,
    isPdfRenderTarget: false,
    label: 'Save as PDF',
  });
  expect(usePdfDownload('pdf').isPdfRenderTarget).toBeTruthy();
});

test('selects public-only contacts for web and full contacts for PDF output', async () => {
  const profileData = {
    email: 'jane.private@example.com',
    label: 'Template Engineer',
    location: {
      city: 'London',
      countryCode: 'UK',
    },
    name: 'Jane Private',
    phone: '+1 555-0199',
    profiles: [
      {
        url: 'https://example.com/jane-private',
      },
    ],
    summary: 'Template summary.',
  };
  expect(getProfileContactItems(profileData, 'web').map((item) => item.kind)).toEqual([
    'location',
    'profile',
  ]);
  expect(getProfileContactItems(profileData, 'pdf').map((item) => item.kind)).toEqual([
    'email',
    'phone',
    'location',
    'profile',
  ]);
  expect(usePdfDownload().href).toBe(RESUME_PDF_DOWNLOAD_HREF);
});

test('keeps sensitive contact links out of the public web resume while exposing the PDF download', async ({ page }) => {
  await gotoResume(page);

  await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);
  await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);
  await expect(page.getByTestId('profile-download')).toHaveCount(1);
  await expect(page.getByTestId('profile-download').locator('a')).toHaveAttribute(
    'href',
    RESUME_PDF_DOWNLOAD_HREF
  );
  await expect(page.getByTestId('profile-contact-location').locator('svg')).toHaveCount(1);
  await expect(page.getByTestId('profile-contact-profile-0').locator('svg')).toHaveCount(1);
});

test('builds a redacted public site and emits the generated PDF using the auto-derived path', async () => {
  const outputDirectory = mkdtempSync(path.join(tmpdir(), 'resume-pdf-dist-'));

  try {
    execFileSync(
      getNpmCommand(),
      ['run', 'build', '--', '--mode', 'test'],
      {
        cwd: PROJECT_ROOT,
        env: {
          ...process.env,
          RESUME_BUILD_OUT_DIR: outputDirectory,
          RESUME_PDF_PREVIEW_PORT: '4274',
        },
        stdio: 'pipe',
      }
    );

    const generatedPdfPath = path.join(
      outputDirectory,
      'downloads',
      'resume.pdf'
    );
    const publicHtml = readFileSync(path.join(outputDirectory, 'index.html'), 'utf8');
    const bundledText = collectTextFiles(outputDirectory).join('\n');

    expect(existsSync(generatedPdfPath)).toBeTruthy();
    expect(publicHtml).not.toContain('mailto:');
    expect(publicHtml).not.toContain('tel:');
    expect(bundledText).not.toContain('john.doe@example.com');
    expect(bundledText).not.toContain('+1 555-0100');
    expect(bundledText).toContain(RESUME_PDF_DOWNLOAD_HREF);
  } finally {
    rmSync(outputDirectory, { force: true, recursive: true });
  }
});
