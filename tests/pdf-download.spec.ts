import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { expect, test } from '@playwright/test';

import { RESUME_PDF_DOWNLOAD_HREF } from '../src/features/pdf-download/constants';
import { usePdfDownload } from '../src/features/pdf-download';
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

test('renders the PDF download affordance on the published resume', async ({ page }) => {
  await gotoResume(page);

  await expect(page.getByTestId('markdown-resume-download')).toHaveAttribute(
    'href',
    RESUME_PDF_DOWNLOAD_HREF
  );
});

test('builds the public site and emits the generated PDF using the auto-derived path', async () => {
  const outputDirectory = mkdtempSync(path.join(tmpdir(), 'resume-pdf-dist-'));

  try {
    execFileSync(
      getNpmCommand(),
      ['run', 'build'],
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
    expect(publicHtml).toContain('<div id="root"></div>');
    expect(bundledText).toContain('Lorin Kalemi');
    expect(bundledText).toContain(RESUME_PDF_DOWNLOAD_HREF);
  } finally {
    rmSync(outputDirectory, { force: true, recursive: true });
  }
});
