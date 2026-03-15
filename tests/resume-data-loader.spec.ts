import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { expect, test } from '@playwright/test';

import {
  loadResumeData,
  resolveResumeDataPath,
} from '../src/data/load-resume-data';

const MINIMAL_RESUME_DATA = {
  basics: {
    email: 'john.doe@example.com',
    label: 'Template Engineer',
    name: 'John Doe',
    phone: '+1 555-0100',
    summary: 'John Doe is a fictional resume sample.',
  },
};

function writeFile(filePath: string, contents: string) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, contents);
}

function withTempEnvDir(
  callback: (envDir: string) => void,
  prefix = 'resume-data-loader-'
) {
  const envDir = mkdtempSync(path.join(tmpdir(), prefix));

  try {
    callback(envDir);
  } finally {
    rmSync(envDir, { force: true, recursive: true });
  }
}

test('loads the configured sample path from .env', async () => {
  withTempEnvDir((envDir) => {
    writeFile(path.join(envDir, '.env'), 'RESUME_DATA_PATH=src/data/resume.sample.json\n');
    writeFile(
      path.join(envDir, 'src/data/resume.sample.json'),
      JSON.stringify(MINIMAL_RESUME_DATA, null, 2)
    );

    const resumeData = loadResumeData({ envDir, mode: 'test', useProcessEnv: false });

    expect(resumeData.basics.name).toBe('John Doe');
    expect(resolveResumeDataPath({ envDir, mode: 'test', useProcessEnv: false })).toBe(
      path.join(envDir, 'src/data/resume.sample.json')
    );
  });
});

test('prefers .env.local over .env when both define RESUME_DATA_PATH', async () => {
  withTempEnvDir((envDir) => {
    writeFile(path.join(envDir, '.env'), 'RESUME_DATA_PATH=src/data/resume.sample.json\n');
    writeFile(path.join(envDir, '.env.local'), 'RESUME_DATA_PATH=src/data/resume.private.json\n');
    writeFile(
      path.join(envDir, 'src/data/resume.sample.json'),
      JSON.stringify(MINIMAL_RESUME_DATA, null, 2)
    );
    writeFile(
      path.join(envDir, 'src/data/resume.private.json'),
      JSON.stringify(
        {
          basics: {
            ...MINIMAL_RESUME_DATA.basics,
            name: 'Private Doe',
          },
        },
        null,
        2
      )
    );

    const resumeData = loadResumeData({ envDir, mode: 'test', useProcessEnv: false });

    expect(resumeData.basics.name).toBe('Private Doe');
  });
});

test('loads a configured local public profile photo path when the file exists', async () => {
  withTempEnvDir((envDir) => {
    writeFile(path.join(envDir, '.env'), 'RESUME_DATA_PATH=src/data/resume.sample.json\n');
    writeFile(
      path.join(envDir, 'src/data/resume.sample.json'),
      JSON.stringify(
        {
          basics: {
            ...MINIMAL_RESUME_DATA.basics,
            photo: {
              src: '/static/profile.jpg',
            },
          },
        },
        null,
        2
      )
    );
    writeFile(path.join(envDir, 'public/static/profile.jpg'), 'placeholder image file');

    const resumeData = loadResumeData({ envDir, mode: 'test', useProcessEnv: false });

    expect(resumeData.basics.photo?.src).toBe('/static/profile.jpg');
  });
});

test('throws a clear error when the configured JSON file is missing', async () => {
  withTempEnvDir((envDir) => {
    writeFile(path.join(envDir, '.env'), 'RESUME_DATA_PATH=src/data/missing.json\n');

    expect(() =>
      loadResumeData({ envDir, mode: 'test', useProcessEnv: false })
    ).toThrow(/was not found/);
  });
});

test('throws a clear error when a configured local public profile photo file is missing', async () => {
  withTempEnvDir((envDir) => {
    writeFile(path.join(envDir, '.env'), 'RESUME_DATA_PATH=src/data/resume.sample.json\n');
    writeFile(
      path.join(envDir, 'src/data/resume.sample.json'),
      JSON.stringify(
        {
          basics: {
            ...MINIMAL_RESUME_DATA.basics,
            photo: {
              src: '/static/private/profile.jpg',
            },
          },
        },
        null,
        2
      )
    );

    expect(() =>
      loadResumeData({ envDir, mode: 'test', useProcessEnv: false })
    ).toThrow(/Resume photo file was not found/);
  });
});

test('throws a clear error when the configured file is not valid JSON', async () => {
  withTempEnvDir((envDir) => {
    writeFile(path.join(envDir, '.env'), 'RESUME_DATA_PATH=src/data/resume.sample.json\n');
    writeFile(path.join(envDir, 'src/data/resume.sample.json'), '{ invalid json');

    expect(() =>
      loadResumeData({ envDir, mode: 'test', useProcessEnv: false })
    ).toThrow(/not valid JSON/);
  });
});

test('throws a clear error when the configured JSON fails schema validation', async () => {
  withTempEnvDir((envDir) => {
    writeFile(path.join(envDir, '.env'), 'RESUME_DATA_PATH=src/data/resume.sample.json\n');
    writeFile(
      path.join(envDir, 'src/data/resume.sample.json'),
      JSON.stringify({ basics: { name: 'Broken Doe' } }, null, 2)
    );

    expect(() =>
      loadResumeData({ envDir, mode: 'test', useProcessEnv: false })
    ).toThrow(/failed validation/);
  });
});
