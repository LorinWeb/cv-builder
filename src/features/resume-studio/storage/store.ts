import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { loadResumeData } from '../../../data/load-resume-data';
import type { ResumeSourceData } from '../../../data/types/resume';
import {
  RESUME_STUDIO_DB_PATH,
  RESUME_STUDIO_DEFAULT_IMPORTED_VERSION_NAME,
  RESUME_STUDIO_MARKDOWN_PATH,
} from '../constants';
import type { ResumeStudioState } from '../types';
import { SqliteResumeStudioStore } from './sqlite-store';

interface ResumeStudioStoreController {
  close(): void;
  createVersion(name: string): ResumeStudioState;
  deleteVersion(id: number): ResumeStudioState;
  getState(): ResumeStudioState;
  initializeDraft(): ResumeStudioState;
  publishActiveVersion(): ResumeStudioState;
  saveDraft(data: ResumeSourceData): ResumeStudioState;
  selectVersion(id: number): ResumeStudioState;
}

function nowIsoString() {
  return new Date().toISOString();
}

function resolveResumeStudioPaths(projectRoot: string) {
  return {
    databasePath: path.resolve(projectRoot, RESUME_STUDIO_DB_PATH),
    markdownPath: path.resolve(projectRoot, RESUME_STUDIO_MARKDOWN_PATH),
  };
}

function writePublishedResumeMarkdown(projectRoot: string, data: ResumeSourceData) {
  const { markdownPath } = resolveResumeStudioPaths(projectRoot);

  mkdirSync(path.dirname(markdownPath), { recursive: true });
  writeFileSync(markdownPath, `${data.markdown.trimEnd()}\n`);
}

function areResumeDataEqual(
  left: ResumeSourceData | null,
  right: ResumeSourceData | null
) {
  return left?.markdown === right?.markdown;
}

export function createResumeStudioStore(
  projectRoot: string
): ResumeStudioStoreController {
  let storage: SqliteResumeStudioStore | null = null;

  function getStorage() {
    if (!storage) {
      storage = new SqliteResumeStudioStore(
        resolveResumeStudioPaths(projectRoot).databasePath
      );
    }

    return storage;
  }

  function close() {
    storage?.close();
    storage = null;
  }

  function ensureSeededFromPublishedResume() {
    const store = getStorage();

    if (store.listVersions().length > 0) {
      return;
    }

    const publishedResume = loadResumeData({ projectRoot });
    const timestamp = nowIsoString();
    const versionId = store.createVersion(
      RESUME_STUDIO_DEFAULT_IMPORTED_VERSION_NAME,
      publishedResume,
      timestamp,
      timestamp
    );

    store.setActiveVersion(versionId);
    store.setPublishedVersion(versionId, publishedResume, timestamp);
  }

  function getDraftState(): ResumeStudioState {
    ensureSeededFromPublishedResume();

    const activeVersion = getStorage().getActiveVersion();
    const publishedState = getStorage().getPublishedState();

    if (!activeVersion) {
      return {
        activeVersionId: null,
        activeVersionName: null,
        draft: null,
        draftUpdatedAt: null,
        hasUnpublishedChanges: false,
        isActiveVersionPublished: false,
        isInitialized: false,
        publishedDraft: publishedState?.data || null,
        publishedVersionId: publishedState?.id || null,
        versions: getStorage().listVersions(),
      };
    }

    const hasUnpublishedChanges = Boolean(
      publishedState && !areResumeDataEqual(activeVersion.data, publishedState.data)
    );
    const isActiveVersionPublished = Boolean(
      publishedState && activeVersion.id === publishedState.id
    );

    return {
      activeVersionId: activeVersion.id,
      activeVersionName: activeVersion.name,
      draft: activeVersion.data,
      draftUpdatedAt: activeVersion.updatedAt,
      hasUnpublishedChanges,
      isActiveVersionPublished,
      isInitialized: true,
      publishedDraft: publishedState?.data || null,
      publishedVersionId: publishedState?.id || null,
      versions: getStorage().listVersions(),
    };
  }

  function getActiveVersionOrThrow(errorMessage: string) {
    const activeVersion = getStorage().getActiveVersion();

    if (!activeVersion) {
      throw new Error(errorMessage);
    }

    return activeVersion;
  }

  function getState() {
    return getDraftState();
  }

  function initializeDraft() {
    return getState();
  }

  function saveDraft(data: ResumeSourceData) {
    const activeVersion = getActiveVersionOrThrow(
      'Cannot save before an editable resume version exists.'
    );

    getStorage().updateVersion(activeVersion.id, data, nowIsoString());

    return getState();
  }

  function createVersion(name: string) {
    const trimmedName = name.trim();

    if (trimmedName.length === 0) {
      throw new Error('Version name is required.');
    }

    const activeVersion = getActiveVersionOrThrow(
      'Cannot create a version before an editable resume version exists.'
    );

    const versionId = getStorage().createVersion(
      trimmedName,
      activeVersion.data,
      nowIsoString()
    );

    getStorage().setActiveVersion(versionId);

    return getState();
  }

  function publishActiveVersion() {
    const activeVersion = getActiveVersionOrThrow(
      'Cannot publish before an editable resume version exists.'
    );

    writePublishedResumeMarkdown(projectRoot, activeVersion.data);
    getStorage().setPublishedVersion(
      activeVersion.id,
      activeVersion.data,
      activeVersion.updatedAt
    );

    return getState();
  }

  function deleteVersion(id: number) {
    const store = getStorage();
    const version = store.getVersion(id);
    const publishedState = store.getPublishedState();
    const activeVersion = store.getActiveVersion();

    if (!version) {
      throw new Error(`Resume Studio version ${id} was not found.`);
    }

    if (publishedState?.id === id) {
      throw new Error('Cannot delete the published version.');
    }

    if (activeVersion?.id === id) {
      const nextActiveVersionId =
        publishedState?.id || store.listVersions()[0]?.id || null;

      store.setActiveVersion(nextActiveVersionId);
    }

    store.deleteVersion(id);

    return getState();
  }

  function selectVersion(id: number) {
    const version = getStorage().getVersion(id);

    if (!version) {
      throw new Error(`Resume Studio version ${id} was not found.`);
    }

    getStorage().setActiveVersion(id);

    return getState();
  }

  return {
    close,
    createVersion,
    deleteVersion,
    getState,
    initializeDraft,
    publishActiveVersion,
    saveDraft,
    selectVersion,
  };
}
