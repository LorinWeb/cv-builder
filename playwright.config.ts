import { defineConfig, devices } from '@playwright/test';

import {
  DEFAULT_RESUME_DATA_PATH,
  RESUME_DATA_PATH_ENV_VAR,
} from './src/data/resume-data-paths';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  snapshotPathTemplate:
    '{testDir}/{testFilePath}-snapshots/{arg}-{projectName}{ext}',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    viewport: {
      width: 1280,
      height: 1600,
    },
    colorScheme: 'light',
    locale: 'en-GB',
    timezoneId: 'Europe/London',
    deviceScaleFactor: 1,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: {
          width: 1280,
          height: 1600,
        },
        deviceScaleFactor: 1,
      },
    },
  ],
  webServer: {
    command:
      `env ${RESUME_DATA_PATH_ENV_VAR}=${DEFAULT_RESUME_DATA_PATH} npm run build && npm run preview:visual`,
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
