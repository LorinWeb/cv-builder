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
  saveDraft(data: ResumeSourceData): ResumeStudioState;
  selectVersion(id: number): ResumeStudioState;
}

function nowIsoString() {
  return new Date().toISOString();
}

export function createResumeStudioStore(
  projectRoot: string
): ResumeStudioStoreController {
  const paths = resolveResumeStudioPaths(projectRoot);
  let storage: SqliteResumeStudioStore | null = null;

  function getStorage() {
    if (!storage) {
      storage = new SqliteResumeStudioStore(paths.databasePath);
    }

    return storage;
  }

  function close() {
    storage?.close();
    storage = null;
  }

  function getDraftState(source: 'private' | 'sample'): ResumeStudioState {
    const activeVersion = getStorage().getActiveVersion();

    if (!activeVersion) {
      return {
        activeVersionId: null,
        activeVersionName: null,
        canEdit: true,
        draft: null,
        draftUpdatedAt: null,
        isInitialized: false,
        isWizardCompatible: true,
        source,
        versions: [],
        warnings: [],
      };
    }

    const warnings = getResumeStudioWarnings(activeVersion.data);

    return {
      activeVersionId: activeVersion.id,
      activeVersionName: activeVersion.name,
      canEdit: true,
      draft: activeVersion.data,
      draftUpdatedAt: activeVersion.updatedAt,
      isInitialized: true,
      isWizardCompatible: warnings.length === 0,
      source: 'private',
      versions: getStorage().listVersions(),
      warnings,
    };
  }

  function setActiveVersionAndSync(id: number) {
    const storage = getStorage();
    const version = storage.getVersion(id);

    if (!version) {
      throw new Error(`Resume Studio version ${id} was not found.`);
    }

    storage.setActiveVersion(id);
    writeResumeStudioPrivateData(projectRoot, version.data);

    return version;
  }

  function maybeImportExistingPrivateResume() {
    const storage = getStorage();
    const activeVersion = storage.getActiveVersion();

    if (activeVersion) {
      return;
    }

    const legacyDraft = storage.getLegacyDraft();

    if (legacyDraft) {
      const versionId = storage.createVersion(
        RESUME_STUDIO_DEFAULT_RECOVERED_VERSION_NAME,
        legacyDraft.data,
        legacyDraft.updatedAt,
        legacyDraft.updatedAt
      );

      setActiveVersionAndSync(versionId);
      return;
    }

    const existingVersions = storage.listVersions();

    if (existingVersions.length > 0) {
      setActiveVersionAndSync(existingVersions[0].id);
      return;
    }

    const privateData = readResumeStudioPrivateData(projectRoot);

    if (!privateData) {
      return;
    }

    const timestamp = nowIsoString();
    const versionId = storage.createVersion(
      RESUME_STUDIO_DEFAULT_IMPORTED_VERSION_NAME,
      privateData,
      timestamp,
      timestamp
    );

    setActiveVersionAndSync(versionId);
  }

  function getState() {
    maybeImportExistingPrivateResume();

    return getDraftState(
      readResumeStudioPrivateData(projectRoot) ? 'private' : 'sample'
    );
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

    setActiveVersionAndSync(versionId);

    return getState();
  }

  function saveDraft(data: ResumeSourceData) {
    const activeVersion = getStorage().getActiveVersion();

    if (!activeVersion) {
      throw new Error('Cannot save before an editable CV version exists.');
    }

    const timestamp = nowIsoString();

    getStorage().updateVersion(activeVersion.id, data, timestamp);
    writeResumeStudioPrivateData(projectRoot, data);

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

    setActiveVersionAndSync(versionId);

    return getState();
  }

  function deleteVersion(id: number) {
    const storage = getStorage();
    const version = storage.getVersion(id);

    if (!version) {
      throw new Error(`Resume Studio version ${id} was not found.`);
    }

    if (storage.getActiveVersion()?.id === id) {
      throw new Error('Cannot delete the active version.');
    }

    storage.deleteVersion(id);

    return getState();
  }

  function selectVersion(id: number) {
    setActiveVersionAndSync(id);

    return getState();
  }

  return {
    close,
    createVersion,
    deleteVersion,
    getState,
    initializeDraft,
    saveDraft,
    selectVersion,
  };
}
