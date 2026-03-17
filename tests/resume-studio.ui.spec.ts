import { expect, test } from '@playwright/test';
import { createServer, type InlineConfig, type ViteDevServer } from 'vite';

import { createAppViteConfig } from '../vite.config';
import {
  createTempProjectRoot,
  destroyTempProjectRoot,
  writeProjectFile,
} from './support/temp-project';

const DEV_SERVER_PORT = 4175;

test.describe.serial('Resume Studio dev flow', () => {
  let server: ViteDevServer | null = null;
  let projectRoot: string;

  test.beforeAll(async () => {
    projectRoot = createTempProjectRoot('resume-studio-ui-');
    writeProjectFile(
      projectRoot,
      'src/data/resume.sample.json',
      JSON.stringify(
        {
          basics: {
            label: 'Template Engineer',
            name: 'John Doe',
            summary: 'Template summary',
          },
        },
        null,
        2
      )
    );

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
      port: DEV_SERVER_PORT,
      strictPort: true,
    };

    server = await createServer(config);
    await server.listen();
  });

  test.afterAll(async () => {
    await server?.close();
    destroyTempProjectRoot(projectRoot);
  });

  test('renders an instant iframe preview, autosaves edits, and manages versions', async ({
    page,
  }) => {
    await page.goto(`http://127.0.0.1:${DEV_SERVER_PORT}`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('resume-studio-launcher')).toHaveText(
      'Create your resume'
    );

    await page.getByTestId('resume-studio-launcher').click();
    await expect(page.getByTestId('resume-studio-dialog')).toBeVisible();
    const previewFrame = page.frameLocator('[data-testid="resume-studio-preview-frame"]');
    await expect(previewFrame.getByTestId('profile-title')).toHaveText('Your Name', {
      timeout: 15000,
    });
    await expect(previewFrame.getByTestId('resume-studio-launcher')).toHaveCount(0);
    const previewViewport = page.getByTestId('resume-studio-preview-viewport');
    const previewShell = page.getByTestId('resume-studio-preview-shell');
    const viewportBox = await previewViewport.boundingBox();
    const shellBox = await previewShell.boundingBox();

    expect(viewportBox).not.toBeNull();
    expect(shellBox).not.toBeNull();
    expect(shellBox!.x).toBeGreaterThan(viewportBox!.x + 8);
    expect(shellBox!.y).toBeGreaterThan(viewportBox!.y + 8);
    expect(shellBox!.x + shellBox!.width).toBeLessThan(
      viewportBox!.x + viewportBox!.width - 8
    );
    expect(shellBox!.y + shellBox!.height).toBeLessThan(
      viewportBox!.y + viewportBox!.height - 8
    );

    await page.getByTestId('resume-studio-photo-input').setInputFiles({
      buffer: Buffer.alloc(512 * 1024, 97),
      mimeType: 'image/png',
      name: 'portrait.png',
    });
    await expect(page.getByTestId('resume-studio-photo-preview')).toHaveAttribute(
      'src',
      /\/static\/private\//
    );
    await page.getByTestId('resume-studio-remove-photo').click();
    await expect(page.getByTestId('resume-studio-photo-preview')).toHaveCount(0);
    await expect(page.getByTestId('resume-studio-autosave-status')).toHaveText(
      'All changes saved.'
    );

    await page.getByTestId('resume-studio-field-basics-name').fill('Jane Template');
    await page.getByLabel('Title').fill('Staff Engineer');
    await page
      .getByTestId('resume-studio-field-basics-summary')
      .fill('Product-minded engineering leader.');
    await expect(previewFrame.getByTestId('profile-title')).toHaveText('Jane Template');
    await expect(previewFrame.getByTestId('profile-subtitle')).toHaveText('Staff Engineer');
    await expect(page.getByTestId('resume-studio-autosave-status')).toHaveText(
      'Changes pending…'
    );
    await expect(page.getByTestId('resume-studio-autosave-status')).toHaveText(
      'All changes saved.'
    );

    await expect(page.getByTestId('profile-title')).toHaveText('Jane Template');
    await expect(page.getByTestId('profile-subtitle')).toHaveText('Staff Engineer');
    await expect(page.getByTestId('resume-studio-launcher')).toHaveText('Edit resume');

    await page.getByTestId('resume-studio-see-versions').click();
    await expect(page.getByTestId('resume-studio-versions')).toContainText(
      'Primary resume'
    );
    await page.getByTestId('resume-studio-version-name').fill('Staff CV');
    await page.getByTestId('resume-studio-create-version').click();
    await expect(
      page.getByText('Staff CV created and opened for editing.')
    ).toBeVisible();

    await page.getByLabel('Title').fill('Principal Engineer');
    await expect(previewFrame.getByTestId('profile-subtitle')).toHaveText(
      'Principal Engineer'
    );
    await expect(page.getByTestId('resume-studio-autosave-status')).toHaveText(
      'All changes saved.'
    );
    await expect(page.getByTestId('profile-subtitle')).toHaveText('Principal Engineer');

    await page.getByTestId('resume-studio-see-versions').click();
    await page
      .getByTestId('resume-studio-version-item-1')
      .getByRole('button', { name: 'Edit version' })
      .click();
    await expect(previewFrame.getByTestId('profile-subtitle')).toHaveText('Staff Engineer');
    await expect(page.getByTestId('profile-subtitle')).toHaveText('Staff Engineer');

    await page.getByTestId('resume-studio-see-versions').click();
    await page
      .getByTestId('resume-studio-version-item-2')
      .getByRole('button', { name: 'Edit version' })
      .click();
    await expect(previewFrame.getByTestId('profile-subtitle')).toHaveText(
      'Principal Engineer'
    );
    await expect(page.getByTestId('profile-subtitle')).toHaveText('Principal Engineer');

    await page.getByTestId('resume-studio-see-versions').click();
    await expect(
      page
        .getByTestId('resume-studio-version-item-2')
        .getByRole('button', { name: 'Delete' })
    ).toHaveCount(0);
    await page
      .getByTestId('resume-studio-version-item-1')
      .getByRole('button', { name: 'Delete' })
      .click();
    await expect(page.getByText('Primary resume deleted.')).toBeVisible();
    await expect(page.getByTestId('resume-studio-version-item-1')).toHaveCount(0);
    await page.getByTestId('resume-studio-back-to-edit').click();
    await expect(page.getByTestId('profile-subtitle')).toHaveText('Principal Engineer');
  });
});
