import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test } from '@playwright/test';

import { RESUME_STUDIO_DEFAULT_IMPORTED_VERSION_NAME } from '../src/features/resume-studio/constants';
import { createResumeStudioStore } from '../src/features/resume-studio/storage/store';
import {
  createTempProjectRoot,
  destroyTempProjectRoot,
  writeProjectFile,
} from './support/temp-project';

const MINIMAL_RESUME = {
  basics: {
    label: 'Template Engineer',
    name: 'John Doe',
    summary: 'Template summary',
  },
};

function withTempProject(callback: (projectRoot: string) => void) {
  const projectRoot = createTempProjectRoot('resume-studio-store-');

  try {
    callback(projectRoot);
  } finally {
    destroyTempProjectRoot(projectRoot);
  }
}

test('initializes the database from an existing private resume file', async () => {
  withTempProject((projectRoot) => {
    writeProjectFile(
      projectRoot,
      'src/data/resume.private.json',
      JSON.stringify(MINIMAL_RESUME, null, 2)
    );

    const store = createResumeStudioStore(projectRoot);
    const state = store.getState();
    const databasePath = path.join(projectRoot, 'src/data/local/resume-studio.sqlite');

    expect(state.isInitialized).toBeTruthy();
    expect(state.source).toBe('private');
    expect(state.activeVersionName).toBe(RESUME_STUDIO_DEFAULT_IMPORTED_VERSION_NAME);
    expect(state.draft?.basics.name).toBe('John Doe');
    expect(state.versions[0]?.name).toBe(RESUME_STUDIO_DEFAULT_IMPORTED_VERSION_NAME);
    expect(state.versions[0]?.isActive).toBeTruthy();
    expect(existsSync(databasePath)).toBeTruthy();

    store.close();
  });
});

test('saving the active version rewrites src/data/resume.private.json', async () => {
  withTempProject((projectRoot) => {
    const store = createResumeStudioStore(projectRoot);
    const initializedState = store.initializeDraft();

    expect(initializedState.isInitialized).toBeTruthy();

    const savedState = store.saveDraft({
      ...initializedState.draft!,
      basics: {
        ...initializedState.draft!.basics,
        name: 'Jane Doe',
      },
    });

    const savedFile = JSON.parse(
      readFileSync(path.join(projectRoot, 'src/data/resume.private.json'), 'utf8')
    ) as typeof MINIMAL_RESUME;

    expect(savedState.draft?.basics.name).toBe('Jane Doe');
    expect(savedFile.basics.name).toBe('Jane Doe');

    store.close();
  });
});

test('creates and edits multiple named versions independently', async () => {
  withTempProject((projectRoot) => {
    const store = createResumeStudioStore(projectRoot);
    const initializedState = store.initializeDraft();

    const firstSavedState = store.saveDraft({
      ...initializedState.draft!,
      basics: {
        ...initializedState.draft!.basics,
        label: 'Staff Engineer',
      },
    });

    const firstVersionId = firstSavedState.activeVersionId;
    const versionState = store.createVersion('Staff CV');
    const secondVersionId = versionState.activeVersionId;

    expect(firstVersionId).toBeTruthy();
    expect(secondVersionId).toBeTruthy();
    expect(versionState.activeVersionName).toBe('Staff CV');
    expect(versionState.draft?.basics.label).toBe('Staff Engineer');

    const principalState = store.saveDraft({
      ...versionState.draft!,
      basics: {
        ...versionState.draft!.basics,
        label: 'Principal Engineer',
      },
    });

    expect(principalState.draft?.basics.label).toBe('Principal Engineer');

    const firstVersionState = store.selectVersion(firstVersionId!);

    expect(firstVersionState.draft?.basics.label).toBe('Staff Engineer');
    expect(firstVersionState.activeVersionId).toBe(firstVersionId);

    const secondVersionState = store.selectVersion(secondVersionId!);

    expect(secondVersionState.draft?.basics.label).toBe('Principal Engineer');
    expect(secondVersionState.activeVersionId).toBe(secondVersionId);

    store.close();
  });
});

test('deletes inactive versions but never the active version', async () => {
  withTempProject((projectRoot) => {
    const store = createResumeStudioStore(projectRoot);
    const initializedState = store.initializeDraft();
    const primaryVersionId = initializedState.activeVersionId!;
    const secondVersionState = store.createVersion('Consulting CV');
    const secondVersionId = secondVersionState.activeVersionId!;

    const deletedState = store.deleteVersion(primaryVersionId);

    expect(deletedState.activeVersionId).toBe(secondVersionId);
    expect(deletedState.versions).toHaveLength(1);
    expect(deletedState.versions[0]?.id).toBe(secondVersionId);

    expect(() => store.deleteVersion(secondVersionId)).toThrow(
      'Cannot delete the active version.'
    );

    store.close();
  });
});

test('preserves unsupported sections when saving, versioning, and switching', async () => {
  withTempProject((projectRoot) => {
    writeProjectFile(
      projectRoot,
      'src/data/resume.private.json',
      JSON.stringify(
        {
          ...MINIMAL_RESUME,
          languages: [
            {
              level: 'Native',
              name: 'English',
            },
          ],
        },
        null,
        2
      )
    );

    const store = createResumeStudioStore(projectRoot);
    const importedState = store.getState();

    store.saveDraft({
      ...importedState.draft!,
      basics: {
        ...importedState.draft!.basics,
        summary: 'Updated summary',
      },
    });
    store.createVersion('Updated summary');
    const selectedState = store.selectVersion(
      store
        .getState()
        .versions.find(
          (version) => version.name === RESUME_STUDIO_DEFAULT_IMPORTED_VERSION_NAME
        )!.id
    );

    expect(selectedState.draft?.languages?.[0]?.name).toBe('English');

    const savedFile = JSON.parse(
      readFileSync(path.join(projectRoot, 'src/data/resume.private.json'), 'utf8')
    ) as { languages?: Array<{ name: string }> };

    expect(savedFile.languages?.[0]?.name).toBe('English');

    store.close();
  });
});
