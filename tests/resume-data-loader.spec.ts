import path from 'node:path';

import { expect, test } from '@playwright/test';

import {
  getResumeDataWatchPaths,
  loadResumeData,
  RESUME_DATA_PATH,
  resolveResumeDataPath,
} from '../src/data/load-resume-data';
import {
  createTempProjectRoot,
  destroyTempProjectRoot,
  writeProjectFile,
} from './support/temp-project';

function withTempProject(callback: (projectRoot: string) => void) {
  const projectRoot = createTempProjectRoot('resume-data-loader-');

  try {
    callback(projectRoot);
  } finally {
    destroyTempProjectRoot(projectRoot);
  }
}

test('loads src/data/resume.md as the only resume source', async () => {
  withTempProject((projectRoot) => {
    writeProjectFile(
      projectRoot,
      RESUME_DATA_PATH,
      '# Jane Doe\r\n\r\nLead platform work.'
    );

    expect(loadResumeData({ projectRoot })).toEqual({
      markdown: '# Jane Doe\n\nLead platform work.',
    });
    expect(resolveResumeDataPath({ projectRoot })).toBe(
      path.join(projectRoot, RESUME_DATA_PATH)
    );
    expect(getResumeDataWatchPaths({ projectRoot })).toEqual([
      path.join(projectRoot, RESUME_DATA_PATH),
    ]);
  });
});

test('throws a clear error when src/data/resume.md is missing', async () => {
  withTempProject((projectRoot) => {
    expect(() => loadResumeData({ projectRoot })).toThrow(
      /Resume markdown file was not found .* Create src\/data\/resume\.md\./
    );
  });
});

test('throws a clear error when src/data/resume.md is empty', async () => {
  withTempProject((projectRoot) => {
    writeProjectFile(projectRoot, RESUME_DATA_PATH, '\n   \n');

    expect(() => loadResumeData({ projectRoot })).toThrow(
      /src\/data\/resume\.md.*must not be empty/
    );
  });
});
