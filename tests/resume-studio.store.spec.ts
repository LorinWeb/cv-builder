import { DatabaseSync } from 'node:sqlite';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test } from '@playwright/test';

import { RESUME_STUDIO_DEFAULT_IMPORTED_VERSION_NAME } from '../src/features/resume-studio/constants';
import { createResumeStudioStore } from '../src/features/resume-studio/storage/store';
import {
  createTempProjectRoot,
  destroyTempProjectRoot,
  writeProjectFile,
} from './support/temp-project';

const INITIAL_MARKDOWN = '# John Doe\n\nTemplate summary.';

function withTempProject(callback: (projectRoot: string) => void) {
  const projectRoot = createTempProjectRoot('resume-studio-store-');

  try {
    callback(projectRoot);
  } finally {
    destroyTempProjectRoot(projectRoot);
  }
}

function readPublishedResume(projectRoot: string) {
  return readFileSync(path.join(projectRoot, 'src/data/resume.md'), 'utf8');
}

test('initializes the database from src/data/resume.md', async () => {
  withTempProject((projectRoot) => {
    writeProjectFile(projectRoot, 'src/data/resume.md', INITIAL_MARKDOWN);

    const store = createResumeStudioStore(projectRoot);
    const state = store.getState();
    const databasePath = path.join(projectRoot, 'src/data/local/resume-studio.sqlite');

    expect(state.isInitialized).toBeTruthy();
    expect(state.activeVersionName).toBe(RESUME_STUDIO_DEFAULT_IMPORTED_VERSION_NAME);
    expect(state.draft?.markdown).toBe(INITIAL_MARKDOWN);
    expect(state.versions[0]?.isActive).toBeTruthy();
    expect(state.versions[0]?.isPublished).toBeTruthy();
    expect(existsSync(databasePath)).toBeTruthy();

    store.close();
  });
});

test('saving the active version stays local until the version is published', async () => {
  withTempProject((projectRoot) => {
    writeProjectFile(projectRoot, 'src/data/resume.md', INITIAL_MARKDOWN);

    const store = createResumeStudioStore(projectRoot);
    const initializedState = store.getState();
    const initialPublishedFile = readPublishedResume(projectRoot);

    const savedState = store.saveDraft({
      markdown: '# Jane Doe\n\nUpdated summary.',
    });

    expect(initializedState.isInitialized).toBeTruthy();
    expect(savedState.draft?.markdown).toContain('Jane Doe');
    expect(savedState.hasUnpublishedChanges).toBeTruthy();
    expect(readPublishedResume(projectRoot)).toBe(initialPublishedFile);

    const publishedState = store.publishActiveVersion();

    expect(publishedState.hasUnpublishedChanges).toBeFalsy();
    expect(publishedState.isActiveVersionPublished).toBeTruthy();
    expect(readPublishedResume(projectRoot)).toBe('# Jane Doe\n\nUpdated summary.\n');

    store.close();
  });
});

test('creates and edits multiple named versions independently', async () => {
  withTempProject((projectRoot) => {
    writeProjectFile(projectRoot, 'src/data/resume.md', INITIAL_MARKDOWN);

    const store = createResumeStudioStore(projectRoot);
    const initialState = store.getState();

    store.saveDraft({
      markdown: '# John Doe\n\nStaff Engineer',
    });

    const firstVersionId = initialState.activeVersionId;
    const secondVersionState = store.createVersion('Staff CV');
    const secondVersionId = secondVersionState.activeVersionId;

    expect(secondVersionState.activeVersionName).toBe('Staff CV');
    expect(secondVersionState.draft?.markdown).toContain('Staff Engineer');

    store.saveDraft({
      markdown: '# John Doe\n\nPrincipal Engineer',
    });

    expect(store.selectVersion(firstVersionId!).draft?.markdown).toContain('Staff Engineer');
    expect(store.selectVersion(secondVersionId!).draft?.markdown).toContain(
      'Principal Engineer'
    );

    store.close();
  });
});

test('selecting another version does not rewrite src/data/resume.md', async () => {
  withTempProject((projectRoot) => {
    writeProjectFile(projectRoot, 'src/data/resume.md', INITIAL_MARKDOWN);

    const store = createResumeStudioStore(projectRoot);
    const initialState = store.getState();
    const publishedMarkdown = readPublishedResume(projectRoot);

    store.createVersion('Consulting CV');
    store.saveDraft({
      markdown: '# John Doe\n\nConsulting Engineer',
    });
    const selectedState = store.selectVersion(initialState.activeVersionId!);

    expect(selectedState.activeVersionId).toBe(initialState.activeVersionId);
    expect(readPublishedResume(projectRoot)).toBe(publishedMarkdown);

    store.close();
  });
});

test('deletes unpublished versions but never the published version', async () => {
  withTempProject((projectRoot) => {
    writeProjectFile(projectRoot, 'src/data/resume.md', INITIAL_MARKDOWN);

    const store = createResumeStudioStore(projectRoot);
    const initialState = store.getState();
    const primaryVersionId = initialState.activeVersionId!;
    const secondVersionId = store.createVersion('Consulting CV').activeVersionId!;

    expect(() => store.deleteVersion(primaryVersionId)).toThrow(
      'Cannot delete the published version.'
    );

    const deletedState = store.deleteVersion(secondVersionId);

    expect(deletedState.activeVersionId).toBe(primaryVersionId);
    expect(deletedState.versions).toHaveLength(1);

    store.close();
  });
});

test('drops the legacy sqlite schema and re-seeds from src/data/resume.md', async () => {
  withTempProject((projectRoot) => {
    writeProjectFile(projectRoot, 'src/data/resume.md', INITIAL_MARKDOWN);

    const databasePath = path.join(projectRoot, 'src/data/local/resume-studio.sqlite');
    mkdirSync(path.dirname(databasePath), { recursive: true });
    const database = new DatabaseSync(databasePath);

    database.exec(`
      CREATE TABLE resume_versions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL,
        data_json TEXT NOT NULL,
        updated_at TEXT
      );
      CREATE TABLE resume_studio_meta (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        active_version_id INTEGER REFERENCES resume_versions(id),
        published_version_id INTEGER REFERENCES resume_versions(id),
        published_data_json TEXT,
        published_updated_at TEXT
      );
      INSERT INTO resume_versions (id, name, created_at, updated_at, data_json)
      VALUES (
        1,
        'Legacy version',
        '2025-01-01T00:00:00.000Z',
        '2025-01-01T00:00:00.000Z',
        '{"basics":{"name":"Legacy User"}}'
      );
      INSERT INTO resume_studio_meta (
        id,
        active_version_id,
        published_version_id,
        published_data_json,
        published_updated_at
      )
      VALUES (
        1,
        1,
        1,
        '{"basics":{"name":"Legacy User"}}',
        '2025-01-01T00:00:00.000Z'
      );
    `);
    database.close();

    const store = createResumeStudioStore(projectRoot);
    const state = store.getState();

    expect(state.draft?.markdown).toBe(INITIAL_MARKDOWN);

    store.close();
  });
});
