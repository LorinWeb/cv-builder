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

function buildSectionOrderScript() {
  return (element: Element) =>
    Array.from(element.children)
      .map((child) => child.getAttribute('data-testid'))
      .filter((value): value is string => Boolean(value));
}

test.describe.serial('PDF render target', () => {
  let server: ViteDevServer | null = null;
  let devServerPort: number;
  let previousRenderTarget: string | undefined;
  let projectRoot: string;

  test.beforeAll(async () => {
    projectRoot = createTempProjectRoot('resume-pdf-target-');
    writeProjectFile(
      projectRoot,
      'src/data/resume.sample.json',
      JSON.stringify(
        {
          basics: {
            email: 'john.doe@example.com',
            impact: [
              {
                text: 'Improved reliability across the platform.',
              },
            ],
            label: 'Template Engineer',
            name: 'John Doe',
            phone: '+1 555-0100',
            profiles: [
              {
                url: 'https://example.com/john-doe',
              },
            ],
            summary: 'Template summary',
          },
          education: [
            {
              area: 'Computer Science',
              endDate: '2013-06-01',
              institution: 'Example University',
              startDate: '2010-09-01',
              studyType: "Bachelor's Degree",
            },
          ],
          skills: [
            {
              keywords: ['Systems design'],
              name: 'Core Skills',
            },
          ],
          work: [
            {
              company: 'Placeholder Labs',
              progression: [
                {
                  company: '',
                  endDate: '2019-12-20',
                  position: 'Lead Product Engineer',
                  startDate: '2018-05-01',
                  summary: 'Led a platform refresh.',
                },
                {
                  company: '',
                  endDate: '2018-04-30',
                  position: 'Senior Software Engineer',
                  startDate: '2016-06-01',
                  summary: 'Delivered product work.',
                },
              ],
              website: 'https://example.com/placeholder-labs',
            },
            {
              company: 'Acme Systems',
              endDate: '2016-01-31',
              position: 'Staff Engineer',
              startDate: '2014-01-01',
              summary: 'Built internal platforms.',
            },
          ],
        },
        null,
        2
      )
    );

    previousRenderTarget = process.env.RESUME_RENDER_TARGET;
    process.env.RESUME_RENDER_TARGET = 'pdf';

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
      throw new Error('Could not resolve the PDF render target server port.');
    }

    devServerPort = (address as AddressInfo).port;
  });

  test.afterAll(async () => {
    await server?.close();
    destroyTempProjectRoot(projectRoot);

    if (typeof previousRenderTarget === 'undefined') {
      delete process.env.RESUME_RENDER_TARGET;
    } else {
      process.env.RESUME_RENDER_TARGET = previousRenderTarget;
    }
  });

  test('uses the ATS-safe single-column PDF presentation', async ({ page }) => {
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

    const mainContent = page.getByTestId('page-main-content');
    const workSection = page.getByTestId('resume-section-professional-experience');

    await expect(page.getByTestId('profile-title')).toHaveText('John Doe', {
      timeout: 30000,
    });
    await expect(page.getByTestId('page-sidebar-right')).toHaveCount(0);
    await expect(page.getByTestId('resume-section-education')).toBeVisible({
      timeout: 30000,
    });
    await expect
      .poll(() => mainContent.evaluate(buildSectionOrderScript()), {
        timeout: 30000,
      })
      .toEqual([
        'resume-section-summary',
        'resume-section-professional-experience',
        'resume-section-selected-achievements',
        'resume-section-skills',
        'resume-section-education',
      ]);

    await expect(page.getByTestId('work-progression-group')).toHaveCount(0);
    await expect(workSection.getByTestId('work-experience-item')).toHaveCount(3);
    await expect(workSection.locator('[data-testid="work-experience-item"] h3')).toHaveText([
      /Lead Product Engineer\s*@\s*Placeholder Labs/,
      /Senior Software Engineer\s*@\s*Placeholder Labs/,
      /Staff Engineer\s*@\s*Acme Systems/,
    ]);
    await expect(workSection.getByTestId('work-experience-date')).toHaveText([
      'May 2018 - Dec 2019',
      'Jun 2016 - Apr 2018',
      'Jan 2014 - Jan 2016',
    ]);
    await expect(page.getByTestId('education-entry-date')).toHaveText([
      'Sep 2010 - Jun 2013',
    ]);
  });
});
