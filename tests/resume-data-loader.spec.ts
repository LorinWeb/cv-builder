import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { expect, test } from '@playwright/test';

import {
  DEFAULT_RESUME_DATA_PATH,
  LOCAL_RESUME_DATA_PATH,
  RESUME_DATA_PATH_ENV_VAR,
} from '../src/data/resume-data-paths';
import {
  loadResumeData,
  resolveResumeDataPath,
} from '../src/data/load-resume-data';
import { redactResumeData } from '../src/features/pdf-download/build';

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

function writeResumeDataEnv(envDir: string, resumeDataPath: string, fileName = '.env') {
  writeFile(path.join(envDir, fileName), `${RESUME_DATA_PATH_ENV_VAR}=${resumeDataPath}\n`);
}

function resolveEnvResumeDataPath(envDir: string, resumeDataPath: string) {
  return path.join(envDir, resumeDataPath);
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
    writeResumeDataEnv(envDir, DEFAULT_RESUME_DATA_PATH);
    writeFile(
      resolveEnvResumeDataPath(envDir, DEFAULT_RESUME_DATA_PATH),
      JSON.stringify(MINIMAL_RESUME_DATA, null, 2)
    );

    const resumeData = loadResumeData({ envDir, mode: 'test', useProcessEnv: false });

    expect(resumeData.basics.name).toBe('John Doe');
    expect(resolveResumeDataPath({ envDir, mode: 'test', useProcessEnv: false })).toBe(
      resolveEnvResumeDataPath(envDir, DEFAULT_RESUME_DATA_PATH)
    );
  });
});

test('prefers .env.local over .env when both define RESUME_DATA_PATH', async () => {
  withTempEnvDir((envDir) => {
    writeResumeDataEnv(envDir, DEFAULT_RESUME_DATA_PATH);
    writeResumeDataEnv(envDir, LOCAL_RESUME_DATA_PATH, '.env.local');
    writeFile(
      resolveEnvResumeDataPath(envDir, DEFAULT_RESUME_DATA_PATH),
      JSON.stringify(MINIMAL_RESUME_DATA, null, 2)
    );
    writeFile(
      resolveEnvResumeDataPath(envDir, LOCAL_RESUME_DATA_PATH),
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
    writeResumeDataEnv(envDir, DEFAULT_RESUME_DATA_PATH);
    writeFile(
      resolveEnvResumeDataPath(envDir, DEFAULT_RESUME_DATA_PATH),
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

test('redacts private contact details from the public resume payload', async () => {
  withTempEnvDir((envDir) => {
    writeResumeDataEnv(envDir, DEFAULT_RESUME_DATA_PATH);
    writeFile(
      resolveEnvResumeDataPath(envDir, DEFAULT_RESUME_DATA_PATH),
      JSON.stringify(MINIMAL_RESUME_DATA, null, 2)
    );

    const resumeData = loadResumeData({ envDir, mode: 'test', useProcessEnv: false });
    const publicResumeData = redactResumeData(resumeData);

    expect('email' in publicResumeData.basics).toBeFalsy();
    expect('phone' in publicResumeData.basics).toBeFalsy();
    expect(publicResumeData.basics.name).toBe('John Doe');
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
    writeResumeDataEnv(envDir, DEFAULT_RESUME_DATA_PATH);
    writeFile(
      resolveEnvResumeDataPath(envDir, DEFAULT_RESUME_DATA_PATH),
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
    writeResumeDataEnv(envDir, DEFAULT_RESUME_DATA_PATH);
    writeFile(resolveEnvResumeDataPath(envDir, DEFAULT_RESUME_DATA_PATH), '{ invalid json');

    expect(() =>
      loadResumeData({ envDir, mode: 'test', useProcessEnv: false })
    ).toThrow(/not valid JSON/);
  });
});

test('throws a clear error when the configured JSON fails schema validation', async () => {
  withTempEnvDir((envDir) => {
    writeResumeDataEnv(envDir, DEFAULT_RESUME_DATA_PATH);
    writeFile(
      resolveEnvResumeDataPath(envDir, DEFAULT_RESUME_DATA_PATH),
      JSON.stringify({ basics: { name: 'Broken Doe' } }, null, 2)
    );

    expect(() =>
      loadResumeData({ envDir, mode: 'test', useProcessEnv: false })
    ).toThrow(/failed validation/);
  });
});
