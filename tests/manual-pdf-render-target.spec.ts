import type { AddressInfo } from 'node:net';

import { expect, test } from '@playwright/test';
import { createServer, type InlineConfig, type ViteDevServer } from 'vite';

import { createAppViteConfig } from '../vite.config';
import {
  createTempProjectRoot,
  destroyTempProjectRoot,
  writeProjectFile,
} from './support/temp-project';
import { waitForAmbientDesignReady } from './support/resume-page';

test.describe.serial('Manual PDF render target', () => {
  let server: ViteDevServer | null = null;
  let devServerPort: number;
  let projectRoot: string;

  test.beforeAll(async () => {
    projectRoot = createTempProjectRoot('manual-pdf-target-');
    writeProjectFile(
      projectRoot,
      'src/data/resume.sample.json',
      JSON.stringify(
        {
          basics: {
            email: 'jane@example.com',
            label: 'Staff Engineer',
            name: 'Jane Doe',
            phone: '+44 123456789',
            summary: 'Unused in manual mode',
          },
          manual: {
            markdown: '# Jane Doe\n\n## Summary\n\nLead platform work.\n\n## Experience\n\n- Built systems.',
          },
          mode: 'manual',
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
        enableResumeStudio: false,
        mode: 'test',
        renderTarget: 'pdf',
      }),
      configFile: false,
    };
    config.server = {
      ...config.server,
      port: 0,
    };

    server = await createServer(config);
    await server.listen();
    const address = server.httpServer?.address();

    if (!address || typeof address === 'string') {
      throw new Error('Could not resolve the manual PDF render target server port.');
    }

    devServerPort = (address as AddressInfo).port;
  });

  test.afterAll(async () => {
    await server?.close();
    destroyTempProjectRoot(projectRoot);
  });

  test('renders the manual markdown document unchanged in the PDF target', async ({
    page,
  }) => {
    await page.emulateMedia({
      media: 'print',
      reducedMotion: 'reduce',
    });
    await page.goto(`http://127.0.0.1:${devServerPort}`);
    await page.waitForLoadState('networkidle');
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    await waitForAmbientDesignReady(page);
    await page.waitForTimeout(200);

    await expect(page.getByTestId('manual-resume-document').locator('h1')).toHaveText(
      'Jane Doe'
    );
    await expect(page.getByTestId('manual-resume-download')).toHaveCount(0);
    await expect(page.getByTestId('profile-section')).toHaveCount(0);
    await expect(page.getByTestId('page-sidebar-right')).toHaveCount(0);
    await expect(page.getByText('Lead platform work.')).toBeVisible();
  });
});
