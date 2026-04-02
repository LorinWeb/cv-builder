import { expect, test, type Locator, type Page } from '@playwright/test';
import type { AddressInfo } from 'node:net';
import { createServer, type InlineConfig, type ViteDevServer } from 'vite';

import { createAppViteConfig } from '../vite.config';
import {
  createTempProjectRoot,
  destroyTempProjectRoot,
  writeProjectFile,
} from './support/temp-project';

function autosaveStatus(page: Page) {
  return page.getByTestId('resume-studio-autosave-status');
}

async function getScrollMetrics(locator: Locator) {
  return locator.evaluate((element) => {
    const maxScrollTop = Math.max(0, element.scrollHeight - element.clientHeight);

    return {
      clientHeight: element.clientHeight,
      maxScrollTop,
      progress: maxScrollTop === 0 ? 0 : element.scrollTop / maxScrollTop,
    };
  });
}

async function setScrollProgress(locator: Locator, progress: number) {
  await locator.evaluate((element, nextProgress) => {
    const maxScrollTop = Math.max(0, element.scrollHeight - element.clientHeight);

    element.scrollTop = maxScrollTop === 0 ? 0 : maxScrollTop * nextProgress;
    element.dispatchEvent(new Event('scroll'));
  }, progress);
}

async function startResumeStudioServer(projectRoot: string) {
  const config: InlineConfig = {
    ...createAppViteConfig({
      command: 'serve',
      dataProjectRoot: projectRoot,
      enableResumePdf: false,
      enableResumeStudio: true,
      mode: 'development',
    }),
    configFile: false,
  };
  config.server = {
    ...config.server,
    port: 0,
  };

  const server = await createServer(config);
  await server.listen();
  const address = server.httpServer?.address();

  if (!address || typeof address === 'string') {
    throw new Error('Could not resolve the Resume Studio UI test server port.');
  }

  return {
    devServerPort: (address as AddressInfo).port,
    server,
  };
}

async function openStudio(page: Page, devServerPort: number) {
  await page.goto(`http://127.0.0.1:${devServerPort}`);
  await page.waitForLoadState('networkidle');
  await expect(page.getByTestId('resume-studio-launcher')).toHaveText('Edit resume', {
    timeout: 15000,
  });
  await page.getByTestId('resume-studio-launcher').click();
  await page.getByTestId('resume-studio-dialog').waitFor({ state: 'visible' });
}

test.describe.configure({ mode: 'serial' });

test.describe.serial('Resume Studio manual-only overlay', () => {
  let server: ViteDevServer | null = null;
  let devServerPort: number;
  let projectRoot: string;

  test.beforeAll(async () => {
    projectRoot = createTempProjectRoot('resume-studio-ui-');
    writeProjectFile(
      projectRoot,
      'src/data/resume.md',
      '# Jane Template\n\nTemplate Engineer'
    );

    const startedServer = await startResumeStudioServer(projectRoot);

    server = startedServer.server;
    devServerPort = startedServer.devServerPort;
  });

  test.afterAll(async () => {
    await server?.close();
    destroyTempProjectRoot(projectRoot);
  });

  test('opens a fullscreen overlay, previews markdown, and publishes to src/data/resume.md', async ({
    page,
  }) => {
    test.setTimeout(60000);

    await openStudio(page, devServerPort);

    const dialog = page.getByTestId('resume-studio-dialog');
    const viewport = page.viewportSize();
    const dialogBox = await dialog.boundingBox();

    expect(viewport).not.toBeNull();
    expect(dialogBox).not.toBeNull();
    expect(dialogBox!.x).toBeLessThanOrEqual(1);
    expect(dialogBox!.y).toBeLessThanOrEqual(1);
    expect(dialogBox!.width).toBeGreaterThanOrEqual(viewport!.width - 2);
    expect(dialogBox!.height).toBeGreaterThanOrEqual(viewport!.height - 2);

    await expect(page.getByTestId('resume-studio-pane-divider')).toBeVisible();
    await expect(page.locator('#resume-studio-editor-markdown-label')).toHaveCount(0);
    await expect(page.getByTestId('resume-studio-field-markdown')).toContainText(
      '# Jane Template'
    );

    const previewFrame = page.frameLocator('[data-testid="resume-studio-preview-frame"]');
    await expect(previewFrame.getByTestId('markdown-resume-document').locator('h1')).toHaveText(
      'Jane Template',
      {
        timeout: 15000,
      }
    );
    await expect(previewFrame.getByTestId('markdown-resume-download')).toHaveCount(0);

    const editor = page.locator('[data-testid="resume-studio-field-markdown"] .cm-content');

    await editor.click();
    await page.keyboard.press('Control+End');
    await page.keyboard.insertText('\n\n## Summary\nPublished summary.');
    await expect(autosaveStatus(page)).toHaveText('Draft saved locally. Publish when ready.');

    await page.getByTestId('resume-studio-publish').click();
    await expect(page.getByText(/published to src\/data\/resume\.md\.$/)).toBeVisible();
    await expect(autosaveStatus(page)).toHaveText('Draft saved locally and published.');

    await page.getByTestId('resume-studio-close').click();
    await expect(page.getByTestId('resume-studio-dialog')).toHaveCount(0);
    await expect(page.getByTestId('markdown-resume-document')).toContainText(
      'Published summary.'
    );
  });
});

test.describe.serial('Resume Studio preview hard breaks', () => {
  let server: ViteDevServer | null = null;
  let devServerPort: number;
  let projectRoot: string;

  test.beforeAll(async () => {
    projectRoot = createTempProjectRoot('resume-studio-preview-hard-breaks-');
    writeProjectFile(
      projectRoot,
      'src/data/resume.md',
      '# Jane Template\n\nLine one  \nLine two'
    );

    const startedServer = await startResumeStudioServer(projectRoot);

    server = startedServer.server;
    devServerPort = startedServer.devServerPort;
  });

  test.afterAll(async () => {
    await server?.close();
    destroyTempProjectRoot(projectRoot);
  });

  test('preserves existing markdown hard breaks in the preview after autosave and refresh', async ({
    page,
  }) => {
    test.setTimeout(60000);

    await openStudio(page, devServerPort);

    const previewFrame = page.frameLocator('[data-testid="resume-studio-preview-frame"]');
    const paragraph = previewFrame.getByTestId('markdown-resume-document').locator('p').first();
    const hasInitialHardBreak = await paragraph.evaluate(
      (element) => Boolean(element.querySelector('br'))
    );

    expect(hasInitialHardBreak).toBeTruthy();

    const editor = page.locator('[data-testid="resume-studio-field-markdown"] .cm-content');

    await editor.click();
    await page.keyboard.press('Control+End');
    await page.keyboard.insertText('\n\nTail');
    await expect(page.getByTestId('resume-studio-field-markdown')).toContainText('Tail');
    await expect(autosaveStatus(page)).toHaveText('Draft saved locally. Publish when ready.');

    const savedState = await page.evaluate(async () => {
      const response = await fetch('/__resume-studio/state');

      return (await response.json()) as {
        draft?: {
          markdown?: string;
        };
      };
    });

    expect(savedState.draft?.markdown).toContain('Line one\\\nLine two');

    await page.reload();
    await page.waitForLoadState('networkidle');

    if ((await page.getByTestId('resume-studio-dialog').count()) === 0) {
      await page.getByTestId('resume-studio-launcher').click();
      await page.getByTestId('resume-studio-dialog').waitFor();
    }

    const reloadedParagraph = page
      .frameLocator('[data-testid="resume-studio-preview-frame"]')
      .getByTestId('markdown-resume-document')
      .locator('p')
      .first();
    const hasReloadedHardBreak = await reloadedParagraph.evaluate(
      (element) => Boolean(element.querySelector('br'))
    );

    expect(hasReloadedHardBreak).toBeTruthy();
  });
});

test.describe.serial('Resume Studio scroll sync', () => {
  let server: ViteDevServer | null = null;
  let devServerPort: number;
  let projectRoot: string;

  test.beforeAll(async () => {
    projectRoot = createTempProjectRoot('resume-studio-scroll-sync-');

    const longMarkdown = [
      '# Jane Template',
      'Template Engineer',
      '',
      ...Array.from({ length: 80 }, (_, index) => [
        `## Section ${index + 1}`,
        `Paragraph ${index + 1} line one.`,
        `Paragraph ${index + 1} line two with more text to keep the preview flowing.`,
        '',
      ]).flat(),
    ].join('\n');

    writeProjectFile(projectRoot, 'src/data/resume.md', longMarkdown);

    const startedServer = await startResumeStudioServer(projectRoot);

    server = startedServer.server;
    devServerPort = startedServer.devServerPort;
  });

  test.afterAll(async () => {
    await server?.close();
    destroyTempProjectRoot(projectRoot);
  });

  test('syncs editor and preview scrolling in both directions and preserves progress after rerender and reload', async ({
    page,
  }) => {
    test.setTimeout(90000);

    await openStudio(page, devServerPort);

    const editorViewport = page.getByTestId('resume-studio-editor-scroll-area-viewport');
    const previewViewport = page
      .frameLocator('[data-testid="resume-studio-preview-frame"]')
      .getByTestId('resume-studio-preview-scroll-area-viewport');

    await expect
      .poll(async () => {
        const editor = await getScrollMetrics(editorViewport);
        const preview = await getScrollMetrics(previewViewport);

        return (
          editor.clientHeight > 0 &&
          editor.maxScrollTop > 0 &&
          preview.clientHeight > 0 &&
          preview.maxScrollTop > 0
        );
      })
      .toBeTruthy();

    await setScrollProgress(editorViewport, 0.45);

    await expect
      .poll(async () => {
        const editor = await getScrollMetrics(editorViewport);
        const preview = await getScrollMetrics(previewViewport);

        return Math.abs(editor.progress - preview.progress);
      })
      .toBeLessThan(0.03);

    await setScrollProgress(previewViewport, 0.72);

    await expect
      .poll(async () => {
        const editor = await getScrollMetrics(editorViewport);
        const preview = await getScrollMetrics(previewViewport);

        return Math.abs(editor.progress - preview.progress);
      })
      .toBeLessThan(0.03);

    const editorContent = page.locator('[data-testid="resume-studio-field-markdown"] .cm-content');
    await editorContent.click();
    await page.keyboard.press('Control+End');
    await page.keyboard.insertText(
      `\n\n## Added section\n${'Extra detail line.\n'.repeat(30)}`
    );
    await expect(autosaveStatus(page)).toHaveText('Draft saved locally. Publish when ready.');

    await expect
      .poll(async () => {
        const editor = await getScrollMetrics(editorViewport);
        const preview = await getScrollMetrics(previewViewport);

        return Math.abs(editor.progress - preview.progress);
      })
      .toBeLessThan(0.03);

    await page.reload();
    await page.waitForLoadState('networkidle');

    if ((await page.getByTestId('resume-studio-dialog').count()) === 0) {
      await page.getByTestId('resume-studio-launcher').click();
      await page.getByTestId('resume-studio-dialog').waitFor();
    }

    const reloadedEditorViewport = page.getByTestId(
      'resume-studio-editor-scroll-area-viewport'
    );
    const reloadedPreviewViewport = page
      .frameLocator('[data-testid="resume-studio-preview-frame"]')
      .getByTestId('resume-studio-preview-scroll-area-viewport');

    await setScrollProgress(reloadedEditorViewport, 0.33);

    await expect
      .poll(async () => {
        const editor = await getScrollMetrics(reloadedEditorViewport);
        const preview = await getScrollMetrics(reloadedPreviewViewport);

        return Math.abs(editor.progress - preview.progress);
      })
      .toBeLessThan(0.03);
  });
});

test.describe.serial('Resume Studio versions popover', () => {
  let server: ViteDevServer | null = null;
  let devServerPort: number;
  let projectRoot: string;

  test.beforeAll(async () => {
    projectRoot = createTempProjectRoot('resume-studio-versions-popover-');
    writeProjectFile(
      projectRoot,
      'src/data/resume.md',
      '# Jane Template\n\nTemplate Engineer'
    );

    const startedServer = await startResumeStudioServer(projectRoot);

    server = startedServer.server;
    devServerPort = startedServer.devServerPort;
  });

  test.afterAll(async () => {
    await server?.close();
    destroyTempProjectRoot(projectRoot);
  });

  test('uses a popover-backed versions menu for open, close, create, select, and delete flows', async ({
    page,
  }) => {
    await openStudio(page, devServerPort);

    const initialActiveVersion =
      (await page.getByTestId('resume-studio-active-version').textContent())?.trim() || '';
    const versionsToggle = page.getByTestId('resume-studio-versions-toggle');
    const versionsMenu = page.getByTestId('resume-studio-versions-menu');

    expect(initialActiveVersion).not.toBe('');

    await versionsToggle.click();
    await expect(versionsMenu).toBeVisible();

    const toggleBox = await versionsToggle.boundingBox();
    const menuBox = await versionsMenu.boundingBox();
    const isPortaledOutsideDialog = await versionsMenu.evaluate(
      (element) => !element.closest('[data-testid="resume-studio-dialog"]')
    );

    expect(toggleBox).not.toBeNull();
    expect(menuBox).not.toBeNull();
    expect(menuBox!.y).toBeGreaterThan(toggleBox!.y + toggleBox!.height - 1);
    expect(
      Math.abs(menuBox!.x + menuBox!.width - (toggleBox!.x + toggleBox!.width))
    ).toBeLessThanOrEqual(32);
    expect(isPortaledOutsideDialog).toBeTruthy();

    await page.keyboard.press('Escape');
    await expect(versionsMenu).toBeHidden();

    await versionsToggle.click();
    await expect(versionsMenu).toBeVisible();
    await page.mouse.click(10, 10);
    await expect(versionsMenu).toBeHidden();

    await versionsToggle.click();
    await page.getByTestId('resume-studio-version-name').fill('Alt CV');
    await page.getByTestId('resume-studio-create-version').click();
    await expect(page.getByTestId('resume-studio-active-version')).toHaveText('Alt CV');
    await expect(versionsMenu).toBeHidden();

    const editor = page.locator('[data-testid="resume-studio-field-markdown"] .cm-content');
    await editor.click();
    await page.keyboard.press('Control+End');
    await page.keyboard.insertText('\n\nAlt version');
    await expect(autosaveStatus(page)).toHaveText('Draft saved locally. Publish when ready.');

    await versionsToggle.click();
    await page
      .getByTestId('resume-studio-version-item-1')
      .getByRole('button', { name: 'Open' })
      .click();
    await expect(page.getByTestId('resume-studio-active-version')).toHaveText(
      initialActiveVersion
    );

    await versionsToggle.click();
    await page
      .locator('[data-testid^="resume-studio-version-item-"]')
      .filter({ hasText: 'Alt CV' })
      .getByRole('button', { name: 'Delete' })
      .click();
    await expect(page.getByText('Alt CV deleted.')).toBeVisible();
  });
});
