import type { AddressInfo } from 'node:net';

import { expect, test, type Page } from '@playwright/test';
import { createServer, type InlineConfig, type ViteDevServer } from 'vite';

import { createAppViteConfig } from '../vite.config';
import {
  createTempProjectRoot,
  destroyTempProjectRoot,
  writeProjectFile,
} from './support/temp-project';
import { waitForAmbientDesignReady } from './support/resume-page';

test.describe.serial('Manual resume rendering', () => {
  let server: ViteDevServer | null = null;
  let devServerPort: number;
  let projectRoot: string;

  test.beforeAll(async () => {
    projectRoot = createTempProjectRoot('resume-manual-visual-');
    writeProjectFile(
      projectRoot,
      'src/data/resume.sample.json',
      JSON.stringify(
        {
          basics: {
            email: 'jane@example.com',
            label: 'Staff Product Engineer',
            name: 'Jane Doe',
            phone: '+44 123456789',
            summary: 'Unused in manual mode',
          },
          manual: {
            markdown: [
              '# Jane Doe',
              '**Staff Product Engineer**',
              'London, UK',
              'jane@example.com | +44 123456789',
              '',
              '---',
              '',
              '## Summary',
              'I build reliable products with a bias for clarity and durable systems.',
              '',
              '## Experience',
              '### Founding Engineer - Example Co',
              '*Oct 2025 - Present*',
              '- Shipped [booking workflows](https://example.com) used in production.',
              '- Led platform architecture decisions.',
              '',
              '## Skills',
              '- React',
              '- TypeScript',
              '- Product engineering',
            ].join('\n'),
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
      throw new Error('Could not resolve the manual resume visual test server port.');
    }

    devServerPort = (address as AddressInfo).port;
  });

  test.afterAll(async () => {
    await server?.close();
    destroyTempProjectRoot(projectRoot);
  });

  async function gotoManualResume(page: Page, media: 'print' | 'screen' = 'screen') {
    await page.emulateMedia({
      media,
      reducedMotion: 'reduce',
    });
    await page.goto(`http://127.0.0.1:${devServerPort}`);
    await page.waitForLoadState('networkidle');
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    await waitForAmbientDesignReady(page);
    await page.waitForTimeout(200);
  }

  test('renders the plain manual markdown layout inside the page container', async ({
    page,
  }) => {
    await gotoManualResume(page);

    await expect(page.getByTestId('manual-resume-shell')).toBeVisible();
    await expect(page.getByTestId('manual-resume-document').locator('h1')).toHaveText('Jane Doe');
    await expect(page.getByTestId('manual-resume-download')).toHaveText('Save as PDF');
    await expect(page.getByTestId('profile-section')).toHaveCount(0);
    await expect(page.getByTestId('page-body')).toHaveCount(0);
    await expect(page.getByTestId('ambient-design-layer')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'booking workflows' })).toBeVisible();
  });

  test('matches the current screen rendering for manual mode', async ({ page }) => {
    await gotoManualResume(page);

    await expect(page).toHaveScreenshot('resume-manual-screen.png', {
      animations: 'disabled',
      caret: 'hide',
      fullPage: true,
      scale: 'css',
    });
  });

  test('matches the current print rendering for manual mode', async ({ page }) => {
    await gotoManualResume(page, 'print');

    await expect(page.getByTestId('manual-resume-download')).toBeHidden();
    await expect(page).toHaveScreenshot('resume-manual-print.png', {
      animations: 'disabled',
      caret: 'hide',
      fullPage: true,
      scale: 'css',
    });
  });
});
