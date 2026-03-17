import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';

import { chromium, type Page } from '@playwright/test';
import { build as viteBuild, preview as vitePreview, type LogLevel } from 'vite';

import { RESUME_PDF_DOWNLOAD_HREF } from '../constants';

const DEFAULT_RESUME_PDF_PREVIEW_PORT = 4174;
const PDF_RENDER_BUILD_MODE = 'production';

function resolvePdfOutputPath(outputRootDir: string, pdfPath: string) {
  return path.resolve(outputRootDir, pdfPath.replace(/^\//, ''));
}

function getResumePdfPreviewPort(processEnv: NodeJS.ProcessEnv = process.env) {
  const resolvedPort = Number(
    processEnv.RESUME_PDF_PREVIEW_PORT || DEFAULT_RESUME_PDF_PREVIEW_PORT
  );

  if (!Number.isInteger(resolvedPort) || resolvedPort <= 0) {
    throw new Error('RESUME_PDF_PREVIEW_PORT must be a positive integer.');
  }

  return resolvedPort;
}

async function withEnvironment<T>(
  overrides: Record<string, string | undefined>,
  callback: () => Promise<T>
) {
  const previousValues = new Map<string, string | undefined>();

  for (const [key, value] of Object.entries(overrides)) {
    previousValues.set(key, process.env[key]);

    if (typeof value === 'undefined') {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  try {
    return await callback();
  } finally {
    for (const [key, value] of previousValues.entries()) {
      if (typeof value === 'undefined') {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

async function closePreviewServer(previewServer: Awaited<ReturnType<typeof vitePreview>>) {
  await new Promise<void>((resolve, reject) => {
    previewServer.httpServer.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

async function waitForResumePage(page: Page) {
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

async function buildPdfRenderTarget({
  configFile,
  logLevel = 'info',
  outDir,
}: {
  configFile: string;
  logLevel?: LogLevel;
  outDir: string;
}) {
  await withEnvironment(
    {
      RESUME_RENDER_TARGET: 'pdf',
    },
    async () => {
      await viteBuild({
        build: {
          emptyOutDir: true,
          outDir,
        },
        configFile,
        logLevel,
        mode: PDF_RENDER_BUILD_MODE,
      });
    }
  );
}

async function writeResumePdf({
  configFile,
  logLevel = 'info',
  outputRootDir,
  previewPort,
  tempDirPrefix = 'cv-lorin-pdf-build-',
}: {
  configFile: string;
  logLevel?: LogLevel;
  outputRootDir: string;
  previewPort: number;
  tempDirPrefix?: string;
}) {
  const previewOutDir = mkdtempSync(path.join(tmpdir(), tempDirPrefix));
  const outputFilePath = resolvePdfOutputPath(outputRootDir, RESUME_PDF_DOWNLOAD_HREF);

  mkdirSync(path.dirname(outputFilePath), { recursive: true });

  try {
    await buildPdfRenderTarget({
      configFile,
      logLevel,
      outDir: previewOutDir,
    });

    const previewServer = await vitePreview({
      build: {
        outDir: previewOutDir,
      },
      configFile,
      preview: {
        host: '127.0.0.1',
        port: previewPort,
        strictPort: true,
      },
    });
    const browser = await chromium.launch();

    try {
      const page = await browser.newPage();

      await page.emulateMedia({
        media: 'print',
        reducedMotion: 'reduce',
      });
      await page.goto(`http://127.0.0.1:${previewPort}/`);
      await waitForResumePage(page);
      await page.pdf({
        path: outputFilePath,
        preferCSSPageSize: true,
        printBackground: true,
      });
    } finally {
      await browser.close();
      await closePreviewServer(previewServer);
    }
  } finally {
    rmSync(previewOutDir, { force: true, recursive: true });
  }
}

export async function emitResumePdf({
  configFile,
  logLevel = 'info',
  outputRootDir,
  tempDirPrefix,
}: {
  configFile: string;
  logLevel?: LogLevel;
  outputRootDir: string;
  tempDirPrefix?: string;
}) {
  await writeResumePdf({
    configFile,
    logLevel,
    outputRootDir,
    previewPort: getResumePdfPreviewPort(),
    tempDirPrefix,
  });
}
