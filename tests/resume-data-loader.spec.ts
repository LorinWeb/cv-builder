import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { expect, test } from '@playwright/test';

import {
  PRIVATE_RESUME_DATA_PATH,
  SAMPLE_RESUME_DATA_PATH,
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

function resolveProjectPath(projectRoot: string, relativePath: string) {
  return path.join(projectRoot, relativePath);
}

function withTempProjectRoot(
  callback: (projectRoot: string) => void,
  prefix = 'resume-data-loader-'
) {
  const projectRoot = mkdtempSync(path.join(tmpdir(), prefix));

  try {
    callback(projectRoot);
  } finally {
    rmSync(projectRoot, { force: true, recursive: true });
  }
}

test('loads the sample resume when the private file is absent', async () => {
  withTempProjectRoot((projectRoot) => {
    writeFile(
      resolveProjectPath(projectRoot, SAMPLE_RESUME_DATA_PATH),
      JSON.stringify(MINIMAL_RESUME_DATA, null, 2)
    );

    const resumeData = loadResumeData({ mode: 'development', projectRoot });

    expect(resumeData.basics.name).toBe('John Doe');
    expect(resolveResumeDataPath({ mode: 'development', projectRoot })).toBe(
      resolveProjectPath(projectRoot, SAMPLE_RESUME_DATA_PATH)
    );
  });
});

test('prefers the private resume when it exists', async () => {
  withTempProjectRoot((projectRoot) => {
    writeFile(
      resolveProjectPath(projectRoot, SAMPLE_RESUME_DATA_PATH),
      JSON.stringify(MINIMAL_RESUME_DATA, null, 2)
    );
    writeFile(
      resolveProjectPath(projectRoot, PRIVATE_RESUME_DATA_PATH),
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

    const resumeData = loadResumeData({ mode: 'development', projectRoot });

    expect(resumeData.basics.name).toBe('Private Doe');
    expect(resolveResumeDataPath({ mode: 'development', projectRoot })).toBe(
      resolveProjectPath(projectRoot, PRIVATE_RESUME_DATA_PATH)
    );
  });
});

test('uses the sample resume in test mode even when a private file exists', async () => {
  withTempProjectRoot((projectRoot) => {
    writeFile(
      resolveProjectPath(projectRoot, SAMPLE_RESUME_DATA_PATH),
      JSON.stringify(MINIMAL_RESUME_DATA, null, 2)
    );
    writeFile(
      resolveProjectPath(projectRoot, PRIVATE_RESUME_DATA_PATH),
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

    const resumeData = loadResumeData({ mode: 'test', projectRoot });

    expect(resumeData.basics.name).toBe('John Doe');
    expect(resolveResumeDataPath({ mode: 'test', projectRoot })).toBe(
      resolveProjectPath(projectRoot, SAMPLE_RESUME_DATA_PATH)
    );
  });
});

test('loads a configured local public profile photo path when the file exists', async () => {
  withTempProjectRoot((projectRoot) => {
    writeFile(
      resolveProjectPath(projectRoot, SAMPLE_RESUME_DATA_PATH),
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
    writeFile(path.join(projectRoot, 'public/static/profile.jpg'), 'placeholder image file');

    const resumeData = loadResumeData({ mode: 'development', projectRoot });

    expect(resumeData.basics.photo?.src).toBe('/static/profile.jpg');
  });
});

test('redacts private contact details from the public resume payload', async () => {
  withTempProjectRoot((projectRoot) => {
    writeFile(
      resolveProjectPath(projectRoot, SAMPLE_RESUME_DATA_PATH),
      JSON.stringify(
        {
          basics: {
            ...MINIMAL_RESUME_DATA.basics,
            summaryAlwaysFirstSection: true,
          },
        },
        null,
        2
      )
    );

    const resumeData = loadResumeData({ mode: 'development', projectRoot });
    const publicResumeData = redactResumeData(resumeData);

    expect('email' in publicResumeData.basics).toBeFalsy();
    expect('phone' in publicResumeData.basics).toBeFalsy();
    expect(publicResumeData.basics.name).toBe('John Doe');
    expect(publicResumeData.basics.summaryAlwaysFirstSection).toBe(true);
  });
});

test('throws a clear error when the sample resume file is missing', async () => {
  withTempProjectRoot((projectRoot) => {
    expect(() =>
      loadResumeData({ mode: 'development', projectRoot })
    ).toThrow(/was not found/);
  });
});

test('throws a clear error when the private resume file is not valid JSON', async () => {
  withTempProjectRoot((projectRoot) => {
    writeFile(
      resolveProjectPath(projectRoot, SAMPLE_RESUME_DATA_PATH),
      JSON.stringify(MINIMAL_RESUME_DATA, null, 2)
    );
    writeFile(resolveProjectPath(projectRoot, PRIVATE_RESUME_DATA_PATH), '{ invalid json');

    expect(() =>
      loadResumeData({ mode: 'development', projectRoot })
    ).toThrow(/resume\.private\.json.*not valid JSON/);
  });
});

test('throws a clear error when a configured local public profile photo file is missing', async () => {
  withTempProjectRoot((projectRoot) => {
    writeFile(
      resolveProjectPath(projectRoot, SAMPLE_RESUME_DATA_PATH),
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
      loadResumeData({ mode: 'development', projectRoot })
    ).toThrow(/Resume photo file was not found/);
  });
});

test('throws a clear error when the configured file is not valid JSON', async () => {
  withTempProjectRoot((projectRoot) => {
    writeFile(resolveProjectPath(projectRoot, SAMPLE_RESUME_DATA_PATH), '{ invalid json');

    expect(() =>
      loadResumeData({ mode: 'development', projectRoot })
    ).toThrow(/not valid JSON/);
  });
});

test('throws a clear error when the configured JSON fails schema validation', async () => {
  withTempProjectRoot((projectRoot) => {
    writeFile(
      resolveProjectPath(projectRoot, SAMPLE_RESUME_DATA_PATH),
      JSON.stringify({ basics: { name: 'Broken Doe' } }, null, 2)
    );

    expect(() =>
      loadResumeData({ mode: 'development', projectRoot })
    ).toThrow(/failed validation/);
  });
});
