import type { ResumeSourceData } from '../../../data/types/resume';
import { getResumeStudioWarnings } from '../compatibility';
import {
  RESUME_STUDIO_DEFAULT_IMPORTED_VERSION_NAME,
  RESUME_STUDIO_DEFAULT_PRIMARY_VERSION_NAME,
  RESUME_STUDIO_DEFAULT_RECOVERED_VERSION_NAME,
} from '../constants';
import type { ResumeStudioState } from '../types';
import {
  readResumeStudioPrivateData,
  resolveResumeStudioPaths,
  writeResumeStudioPrivateData,
} from './json-sync';
import { SqliteResumeStudioStore } from './sqlite-store';
import { createResumeStudioStarterData } from './starter-data';

export interface ResumeStudioStoreController {
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

function areResumeDataEqual(
  left: ResumeSourceData | null,
  right: ResumeSourceData | null
) {
  return JSON.stringify(left) === JSON.stringify(right);
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

  function getStateSource(): 'private' | 'sample' {
    return readResumeStudioPrivateData(projectRoot) ? 'private' : 'sample';
  }

  function setActiveVersion(id: number | null) {
    getStorage().setActiveVersion(id);
  }

  function publishVersionAndSync(
    versionId: number,
    data: ResumeSourceData,
    updatedAt: string,
    writePrivateData = true
  ) {
    getStorage().setPublishedVersion(versionId, data, updatedAt);

    if (writePrivateData) {
      writeResumeStudioPrivateData(projectRoot, data);
    }
  }

  function getDraftState(source: 'private' | 'sample'): ResumeStudioState {
    const activeVersion = getStorage().getActiveVersion();
    const publishedState = getStorage().getPublishedState();

    if (!activeVersion) {
      return {
        activeVersionId: null,
        activeVersionName: null,
        canEdit: true,
        draft: null,
        draftUpdatedAt: null,
        hasUnpublishedChanges: false,
        isActiveVersionPublished: false,
        isInitialized: false,
        isWizardCompatible: true,
        publishedDraft: publishedState?.data || null,
        publishedVersionId: publishedState?.id || null,
        publishedVersionName: publishedState?.name || null,
        source,
        versions: getStorage().listVersions(),
        warnings: [],
      };
    }

    const warnings = getResumeStudioWarnings(activeVersion.data);
    const hasUnpublishedChanges = Boolean(
      publishedState && !areResumeDataEqual(activeVersion.data, publishedState.data)
    );
    const isActiveVersionPublished = Boolean(
      publishedState && activeVersion.id === publishedState.id
    );

    return {
      activeVersionId: activeVersion.id,
      activeVersionName: activeVersion.name,
      canEdit: true,
      draft: activeVersion.data,
      draftUpdatedAt: activeVersion.updatedAt,
      hasUnpublishedChanges,
      isActiveVersionPublished,
      isInitialized: true,
      isWizardCompatible: warnings.length === 0,
      publishedDraft: publishedState?.data || null,
      publishedVersionId: publishedState?.id || null,
      publishedVersionName: publishedState?.name || null,
      source,
      versions: getStorage().listVersions(),
      warnings,
    };
  }

  function maybeImportExistingPrivateResume() {
    const store = getStorage();
    const activeVersion = store.getActiveVersion();
    const publishedState = store.getPublishedState();
    const privateData = readResumeStudioPrivateData(projectRoot);

    if (activeVersion && publishedState) {
      if (!privateData) {
        writeResumeStudioPrivateData(projectRoot, publishedState.data);
      }
      return;
    }

    if (activeVersion && !publishedState) {
      publishVersionAndSync(
        activeVersion.id,
        privateData || activeVersion.data,
        activeVersion.updatedAt,
        !privateData
      );
      return;
    }

    const legacyDraft = store.getLegacyDraft();

    if (legacyDraft) {
      const versionId = store.createVersion(
        RESUME_STUDIO_DEFAULT_RECOVERED_VERSION_NAME,
        legacyDraft.data,
        legacyDraft.updatedAt,
        legacyDraft.updatedAt
      );

      setActiveVersion(versionId);
      publishVersionAndSync(versionId, legacyDraft.data, legacyDraft.updatedAt);
      return;
    }

    const existingVersions = store.listVersions();

    if (existingVersions.length > 0) {
      const version = store.getVersion(existingVersions[0].id);

      if (!version) {
        throw new Error('Resume Studio could not restore the existing version state.');
      }

      setActiveVersion(version.id);
      publishVersionAndSync(
        version.id,
        privateData || version.data,
        version.updatedAt,
        !privateData
      );
      return;
    }

    if (!privateData) {
      return;
    }

    const timestamp = nowIsoString();
    const versionId = store.createVersion(
      RESUME_STUDIO_DEFAULT_IMPORTED_VERSION_NAME,
      privateData,
      timestamp,
      timestamp
    );

    setActiveVersion(versionId);
    publishVersionAndSync(versionId, privateData, timestamp, false);
  }

  function getState() {
    maybeImportExistingPrivateResume();

    return getDraftState(getStateSource());
  }

  function initializeDraft() {
    const currentState = getState();

    if (currentState.isInitialized) {
      return currentState;
    }

    const data = createResumeStudioStarterData();
    const timestamp = nowIsoString();
    const versionId = getStorage().createVersion(
      RESUME_STUDIO_DEFAULT_PRIMARY_VERSION_NAME,
      data,
      timestamp,
      timestamp
    );

    setActiveVersion(versionId);
    publishVersionAndSync(versionId, data, timestamp);

    return getState();
  }

  function saveDraft(data: ResumeSourceData) {
    const activeVersion = getStorage().getActiveVersion();

    if (!activeVersion) {
      throw new Error('Cannot save before an editable CV version exists.');
    }

    const timestamp = nowIsoString();

    getStorage().updateVersion(activeVersion.id, data, timestamp);

    return getState();
  }

  function createVersion(name: string) {
    const trimmedName = name.trim();

    if (trimmedName.length === 0) {
      throw new Error('Version name is required.');
    }

    const activeVersion = getStorage().getActiveVersion();

    if (!activeVersion) {
      throw new Error('Cannot create a version before an editable CV version exists.');
    }

    const versionId = getStorage().createVersion(
      trimmedName,
      activeVersion.data,
      nowIsoString()
    );

    setActiveVersion(versionId);

    return getState();
  }

  function publishActiveVersion() {
    const activeVersion = getStorage().getActiveVersion();

    if (!activeVersion) {
      throw new Error('Cannot publish before an editable CV version exists.');
    }

    publishVersionAndSync(
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

      setActiveVersion(nextActiveVersionId);
    }

    store.deleteVersion(id);

    return getState();
  }

  function selectVersion(id: number) {
    const version = getStorage().getVersion(id);

    if (!version) {
      throw new Error(`Resume Studio version ${id} was not found.`);
    }

    setActiveVersion(id);

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
