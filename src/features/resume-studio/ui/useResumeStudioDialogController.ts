import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

import {
  applyResumeStudioDraft,
  normalizeResumeStudioMarkdown,
  toResumeStudioDraft,
} from '../draft';
import {
  createResumeStudioVersion,
  deleteResumeStudioVersion,
  publishResumeStudioPreview,
  publishResumeStudioVersion,
  ResumeStudioApiError,
  saveResumeStudioDraft,
  selectResumeStudioVersion,
} from '../runtime';
import { RESUME_STUDIO_AUTOSAVE_DELAY_MS } from '../constants';
import type { ResumeStudioDraft, ResumeStudioState } from '../types';

interface UseResumeStudioDialogControllerProps {
  onOpenChange: (open: boolean) => void;
  onStateChange: (state: ResumeStudioState) => void;
  open: boolean;
  state: ResumeStudioState;
}

function getPersistedManualMarkdown(state: ResumeStudioState['draft']) {
  return state?.mode === 'manual'
    ? normalizeResumeStudioMarkdown(state.manual?.markdown || '')
    : '';
}

function getAutosaveStatusLabel({
  errorMessage,
  hasUnsavedChanges,
  isSaving,
  state,
}: {
  errorMessage: string | null;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  state: ResumeStudioState;
}) {
  if (errorMessage) {
    return 'Local save needs attention.';
  }

  if (isSaving) {
    return 'Saving draft locally...';
  }

  if (hasUnsavedChanges) {
    return 'Local changes pending...';
  }

  if (state.hasUnpublishedChanges) {
    return 'Draft saved locally. Publish when ready.';
  }

  if (state.isActiveVersionPublished) {
    return 'Draft saved locally and published.';
  }

  return 'Editing a saved version. Publish when ready.';
}

function toFieldName(fieldName: string) {
  return fieldName === 'manual.markdown' ? 'markdown' : null;
}

export function useResumeStudioDialogController({
  onOpenChange,
  onStateChange,
  open,
  state,
}: UseResumeStudioDialogControllerProps) {
  const initialDraft = state.draft ? toResumeStudioDraft(state.draft) : { markdown: '' };
  const form = useForm<ResumeStudioDraft>({
    defaultValues: initialDraft,
  });
  const [markdown, setMarkdown] = useState(initialDraft.markdown);
  const [sourceDraft, setSourceDraft] = useState(state.draft);
  const [persistedMarkdown, setPersistedMarkdown] = useState(
    getPersistedManualMarkdown(state.draft)
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createVersionName, setCreateVersionName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [isDeletingVersionId, setIsDeletingVersionId] = useState<number | null>(null);
  const [isSelectingVersionId, setIsSelectingVersionId] = useState<number | null>(null);
  const [isVersionsMenuOpen, setIsVersionsMenuOpen] = useState(false);
  const loadedVersionIdRef = useRef(state.activeVersionId);
  const wasOpenRef = useRef(open);
  const savePromiseRef = useRef<Promise<ResumeStudioState | null> | null>(null);
  const hasUnsavedChanges = markdown !== persistedMarkdown;
  const autosaveStatusLabel = getAutosaveStatusLabel({
    errorMessage,
    hasUnsavedChanges,
    isSaving,
    state,
  });
  const canCreateVersion =
    !isSaving &&
    !isCreatingVersion &&
    isDeletingVersionId === null &&
    isSelectingVersionId === null &&
    !isPublishing;
  const canPublish =
    !hasUnsavedChanges &&
    !isSaving &&
    !isPublishing &&
    (!state.isActiveVersionPublished || state.hasUnpublishedChanges);
  const previewData =
    sourceDraft ? applyResumeStudioDraft(sourceDraft, { markdown }) : null;
  const publishButtonLabel =
    isPublishing
      ? 'Publishing...'
      : state.isActiveVersionPublished && !state.hasUnpublishedChanges
        ? 'Published'
        : 'Publish';

  const syncLoadedState = useEffectEvent(
    (nextState: ResumeStudioState, { resetForm }: { resetForm: boolean }) => {
      if (!nextState.draft) {
        return;
      }

      const nextDraft = toResumeStudioDraft(nextState.draft);

      loadedVersionIdRef.current = nextState.activeVersionId;
      setSourceDraft(nextState.draft);
      setPersistedMarkdown(getPersistedManualMarkdown(nextState.draft));
      setMarkdown(nextDraft.markdown);
      form.clearErrors();

      if (resetForm) {
        form.reset(nextDraft);
      }

      onStateChange(nextState);
    }
  );

  const saveDraftValues = useEffectEvent(async (markdownToSave: string) => {
    if (!sourceDraft) {
      return null;
    }

    if (savePromiseRef.current) {
      await savePromiseRef.current;

      if (markdownToSave === persistedMarkdown) {
        return state;
      }
    }

    setErrorMessage(null);
    setIsSaving(true);

    const savePromise = (async () => {
      try {
        const nextState = await saveResumeStudioDraft({
          draft: applyResumeStudioDraft(sourceDraft, {
            markdown: markdownToSave,
          }),
        });

        syncLoadedState(nextState, { resetForm: false });
        return nextState;
      } catch (error) {
        if (error instanceof ResumeStudioApiError && error.fieldErrors) {
          for (const [fieldName, message] of Object.entries(error.fieldErrors)) {
            const nextFieldName = toFieldName(fieldName);

            if (!nextFieldName) {
              continue;
            }

            form.setError(nextFieldName, {
              message,
              type: 'server',
            });
          }
        }

        setErrorMessage(
          error instanceof Error ? error.message : 'Could not save the version.'
        );
        return null;
      } finally {
        setIsSaving(false);
      }
    })();

    savePromiseRef.current = savePromise;

    try {
      return await savePromise;
    } finally {
      if (savePromiseRef.current === savePromise) {
        savePromiseRef.current = null;
      }
    }
  });

  const flushDraft = useEffectEvent(async () => {
    if (savePromiseRef.current) {
      await savePromiseRef.current;
    }

    if (!sourceDraft || markdown === persistedMarkdown) {
      return state;
    }

    return saveDraftValues(markdown);
  });

  useEffect(() => {
    const reopened = open && !wasOpenRef.current;
    const versionChanged = loadedVersionIdRef.current !== state.activeVersionId;

    wasOpenRef.current = open;

    if (!state.draft) {
      return;
    }

    if (!reopened && !versionChanged) {
      return;
    }

    syncLoadedState(state, { resetForm: true });
    setCreateVersionName('');
    setErrorMessage(null);
    setStatusMessage(null);
    setIsVersionsMenuOpen(false);
  }, [open, state, syncLoadedState]);

  useEffect(() => {
    if (
      !open ||
      !sourceDraft ||
      isSaving ||
      isPublishing ||
      isCreatingVersion ||
      isDeletingVersionId !== null ||
      isSelectingVersionId !== null ||
      markdown === persistedMarkdown
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void saveDraftValues(markdown);
    }, RESUME_STUDIO_AUTOSAVE_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    isCreatingVersion,
    isDeletingVersionId,
    isPublishing,
    isSaving,
    isSelectingVersionId,
    markdown,
    open,
    persistedMarkdown,
    saveDraftValues,
    sourceDraft,
  ]);

  async function handleCreateVersion() {
    setErrorMessage(null);
    setStatusMessage(null);

    const flushedState = await flushDraft();

    if (!flushedState) {
      return;
    }

    setIsCreatingVersion(true);

    try {
      const nextState = await createResumeStudioVersion({
        name: createVersionName,
      });

      syncLoadedState(nextState, { resetForm: true });
      setCreateVersionName('');
      setIsVersionsMenuOpen(false);
      setStatusMessage(
        `${nextState.activeVersionName || 'New version'} created and opened for editing.`
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Could not create the version.'
      );
    } finally {
      setIsCreatingVersion(false);
    }
  }

  async function handleSelectVersion(versionId: number) {
    setErrorMessage(null);
    setStatusMessage(null);
    setIsSelectingVersionId(versionId);

    const flushedState = await flushDraft();

    if (!flushedState) {
      setIsSelectingVersionId(null);
      return;
    }

    try {
      const nextState = await selectResumeStudioVersion(versionId);

      syncLoadedState(nextState, { resetForm: true });
      setIsVersionsMenuOpen(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Could not open the selected version.'
      );
    } finally {
      setIsSelectingVersionId(null);
    }
  }

  async function handleDeleteVersion(versionId: number) {
    setErrorMessage(null);
    setStatusMessage(null);
    setIsDeletingVersionId(versionId);

    try {
      const deletedVersionName =
        state.versions.find((version) => version.id === versionId)?.name || 'Version';
      const nextState = await deleteResumeStudioVersion(versionId);

      syncLoadedState(nextState, {
        resetForm: nextState.activeVersionId !== state.activeVersionId,
      });
      setStatusMessage(`${deletedVersionName} deleted.`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Could not delete the selected version.'
      );
    } finally {
      setIsDeletingVersionId(null);
    }
  }

  async function handlePublishVersion() {
    setErrorMessage(null);
    setStatusMessage(null);

    const flushedState = await flushDraft();

    if (!flushedState) {
      return;
    }

    setIsPublishing(true);

    try {
      const nextState = await publishResumeStudioVersion();

      syncLoadedState(nextState, { resetForm: false });
      publishResumeStudioPreview(nextState.draft!);
      setStatusMessage(
        `${nextState.activeVersionName || 'Current version'} published to src/data/resume.private.json.`
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Could not publish the selected version.'
      );
    } finally {
      setIsPublishing(false);
    }
  }

  async function handleOpenStateChange(nextOpen: boolean) {
    if (nextOpen) {
      onOpenChange(true);
      return;
    }

    const nextState = await flushDraft();

    if (!nextState) {
      return;
    }

    publishResumeStudioPreview(nextState.publishedDraft || nextState.draft!);
    setIsVersionsMenuOpen(false);
    onOpenChange(false);
  }

  return {
    autosaveStatusLabel,
    canCreateVersion,
    canPublish,
    createVersionName,
    errorMessage,
    form,
    handleCreateVersion,
    handleDeleteVersion,
    handleOpenStateChange,
    handlePublishVersion,
    handleSelectVersion,
    isCreatingVersion,
    isDeletingVersionId,
    isSelectingVersionId,
    isVersionsMenuOpen,
    markdown,
    previewData,
    publishButtonLabel,
    setMarkdown,
    setCreateVersionName,
    setIsVersionsMenuOpen,
    statusMessage,
  };
}
