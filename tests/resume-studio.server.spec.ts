import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test } from '@playwright/test';

import { RESUME_STUDIO_WATCH_IGNORED_PATTERNS } from '../src/features/resume-studio/constants';
import { writeResumeStudioPhotoUpload } from '../src/features/resume-studio/server/photo-upload';
import { createAppViteConfig } from '../vite.config';
import { createTempProjectRoot, destroyTempProjectRoot } from './support/temp-project';

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

test('writes uploaded portraits under public/static/private and returns the served src', async () => {
  const projectRoot = createTempProjectRoot('resume-studio-upload-');

  try {
    const result = writeResumeStudioPhotoUpload(
      projectRoot,
      'Portrait.JPG',
      Buffer.from('fake image bytes').toString('base64')
    );
    const uploadedPath = path.join(projectRoot, 'public', result.src.replace(/^\//, ''));

    expect(result.src).toMatch(/^\/static\/private\/portrait-\d+\.jpg$/);
    expect(existsSync(uploadedPath)).toBeTruthy();
    expect(readFileSync(uploadedPath, 'utf8')).toBe('fake image bytes');
  } finally {
    destroyTempProjectRoot(projectRoot);
  }
});
