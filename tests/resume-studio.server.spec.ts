import type { AddressInfo } from 'node:net';
import path from 'node:path';

import { expect, test } from '@playwright/test';
import { createServer, type InlineConfig, type ViteDevServer } from 'vite';

import { RESUME_STUDIO_WATCH_IGNORED_PATTERNS } from '../src/features/resume-studio/constants';
import { createAppViteConfig } from '../vite.config';
import {
  createTempProjectRoot,
  destroyTempProjectRoot,
  writeProjectFile,
} from './support/temp-project';

test('configures Vite to ignore the sqlite sidecar files and use the provided data root', async () => {
  const projectRoot = createTempProjectRoot('resume-studio-config-');

  try {
    const config = createAppViteConfig({
      command: 'serve',
      dataProjectRoot: projectRoot,
      enableResumePdf: false,
      enableResumeStudio: true,
      mode: 'development',
    });

    expect(config.publicDir).toBe(path.resolve(projectRoot, 'public'));
    expect(config.server?.watch?.ignored).toEqual([
      ...RESUME_STUDIO_WATCH_IGNORED_PATTERNS,
    ]);
  } finally {
    destroyTempProjectRoot(projectRoot);
  }
});

test.describe.serial('Resume Studio server validation', () => {
  let server: ViteDevServer | null = null;
  let devServerPort: number;
  let projectRoot: string;

  test.beforeAll(async () => {
    projectRoot = createTempProjectRoot('resume-studio-server-');
    writeProjectFile(
      projectRoot,
      'src/data/resume.md',
      '# John Doe\n\nTemplate summary'
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
      port: 0,
    };

    server = await createServer(config);
    await server.listen();
    const address = server.httpServer?.address();

    if (!address || typeof address === 'string') {
      throw new Error('Could not resolve the Resume Studio server test port.');
    }

    devServerPort = (address as AddressInfo).port;
  });

  test.afterAll(async () => {
    await server?.close();
    destroyTempProjectRoot(projectRoot);
  });

  test('rejects drafts without markdown', async () => {
    const response = await fetch(`http://127.0.0.1:${devServerPort}/__resume-studio/draft`, {
      body: JSON.stringify({
        draft: {
          markdown: '   ',
        },
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PUT',
    });
    const payload = (await response.json()) as {
      error: string;
      fieldErrors?: Record<string, string>;
    };

    expect(response.status).toBe(400);
    expect(payload.error).toBe('Resume draft failed validation.');
    expect(payload.fieldErrors?.markdown).toBe('Resume markdown is required.');
  });
});
