import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { useForm, type Path } from 'react-hook-form';

import { applyResumeStudioDraft, toResumeStudioDraft } from '../draft';
import {
  createResumeStudioVersion,
  deleteResumeStudioVersion,
  publishResumeStudioPreview,
  publishResumeStudioVersion,
  ResumeStudioApiError,
  saveResumeStudioDraft,
  selectResumeStudioVersion,
  uploadResumeStudioPhoto,
} from '../runtime';
import type { ResumeStudioDraft, ResumeStudioState, ResumeStudioStepId } from '../types';
import {
  mergeResumeStudioDraft,
  serializeResumeStudioDraft,
  useResumeStudioDraftSync,
} from './useResumeStudioDraftSync';

type ResumeStudioDialogTab = 'edit' | 'versions';

interface UseResumeStudioDialogControllerProps {
  onOpenChange: (open: boolean) => void;
  onStateChange: (state: ResumeStudioState) => void;
  open: boolean;
  state: ResumeStudioState;
}

function readFileAsBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(reader.error || new Error('Could not read the selected file.'));
    };

    reader.onload = () => {
      const result = reader.result;

      if (typeof result !== 'string') {
        reject(new Error('Could not encode the selected file.'));
        return;
      }

      const [, base64 = ''] = result.split(',', 2);

      resolve(base64);
    };

    reader.readAsDataURL(file);
  });
}

function readSessionStep() {
  if (typeof window === 'undefined') {
    return 'basics' as ResumeStudioStepId;
  }

  const storedValue = window.sessionStorage.getItem('resume-studio-step');

  return (storedValue as ResumeStudioStepId) || 'basics';
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
    return 'Saving draft locally…';
  }

  if (hasUnsavedChanges) {
    return 'Local changes pending…';
  }

  if (state.hasUnpublishedChanges) {
    return 'Draft saved locally. Publish when ready.';
  }

  if (state.isActiveVersionPublished) {
    return 'Draft saved locally and published.';
  }

  return 'Editing a saved version. Publish when ready.';
}

export function useResumeStudioDialogController({
  onOpenChange,
  onStateChange,
  open,
  state,
}: UseResumeStudioDialogControllerProps) {
  const form = useForm<ResumeStudioDraft>({
    defaultValues: state.draft ? toResumeStudioDraft(state.draft) : undefined,
  });
  const [activeTab, setActiveTab] = useState<ResumeStudioDialogTab>('edit');
  const [currentStep, setCurrentStep] = useState<ResumeStudioStepId>(readSessionStep);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createVersionName, setCreateVersionName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [isDeletingVersionId, setIsDeletingVersionId] = useState<number | null>(null);
  const [isSelectingVersionId, setIsSelectingVersionId] = useState<number | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const persistedDraft = state.draft ? toResumeStudioDraft(state.draft) : null;
  const lastSavedDraftSignatureRef = useRef<string | null>(
    persistedDraft ? serializeResumeStudioDraft(persistedDraft) : null
  );
  const liveDraftRef = useRef<ResumeStudioDraft | null>(persistedDraft);
  const liveDraftSignatureRef = useRef<string | null>(
    persistedDraft ? serializeResumeStudioDraft(persistedDraft) : null
  );
  const persistedDraftRef = useRef<ResumeStudioDraft | null>(persistedDraft);
  const sourceDraftRef = useRef(state.draft);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const previewData = state.draft;
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
    isSelectingVersionId === null;
  const canPublish =
    !hasUnsavedChanges &&
    !isSaving &&
    !isPublishing &&
    (!state.isActiveVersionPublished || state.hasUnpublishedChanges);
  const publishButtonLabel =
    isPublishing
      ? 'Publishing…'
      : state.isActiveVersionPublished && !state.hasUnpublishedChanges
        ? 'Published'
        : 'Publish';

  const saveDraftValues = useEffectEvent(async (values: ResumeStudioDraft) => {
    const sourceDraft = sourceDraftRef.current;

    if (!sourceDraft) {
      return null;
    }

    setErrorMessage(null);
    setIsSaving(true);

    try {
      const nextState = await saveResumeStudioDraft({
        draft: applyResumeStudioDraft(sourceDraft, values),
      });
      const savedDraft = toResumeStudioDraft(nextState.draft!);
      const nextLiveDraft = mergeResumeStudioDraft(
        savedDraft,
        form.getValues() as Partial<ResumeStudioDraft>
      );
      const savedDraftSignature = serializeResumeStudioDraft(savedDraft);
      const nextLiveDraftSignature = serializeResumeStudioDraft(nextLiveDraft);

      form.clearErrors();
      sourceDraftRef.current = nextState.draft;
      persistedDraftRef.current = savedDraft;
      liveDraftRef.current = nextLiveDraft;
      liveDraftSignatureRef.current = nextLiveDraftSignature;
      lastSavedDraftSignatureRef.current = savedDraftSignature;
      setHasUnsavedChanges(nextLiveDraftSignature !== savedDraftSignature);
      onStateChange(nextState);
      return nextState;
    } catch (error) {
      if (error instanceof ResumeStudioApiError && error.fieldErrors) {
        for (const [fieldName, message] of Object.entries(error.fieldErrors)) {
          form.setError(fieldName as Path<ResumeStudioDraft>, {
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
  });

  const scheduleStructuralDraftSync = useResumeStudioDraftSync({
    form,
    hasUnsavedChanges,
    isAutosavePaused:
      isSaving ||
      isCreatingVersion ||
      isDeletingVersionId !== null ||
      isSelectingVersionId !== null ||
      isPublishing,
    lastSavedDraftSignatureRef,
    liveDraftRef,
    liveDraftSignatureRef,
    onAutosaveDraft: saveDraftValues,
    open,
    persistedDraftRef,
    setHasUnsavedChanges,
    sourceDraftRef,
    state,
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.sessionStorage.setItem('resume-studio-step', currentStep);
  }, [currentStep]);

  async function handleCreateVersion() {
    setErrorMessage(null);
    setStatusMessage(null);

    if (hasUnsavedChanges) {
      const liveDraft = liveDraftRef.current;

      if (!liveDraft) {
        return;
      }

      const savedState = await saveDraftValues(liveDraft);

      if (!savedState) {
        return;
      }
    }

    setIsCreatingVersion(true);

    try {
      const nextState = await createResumeStudioVersion({
        name: createVersionName,
      });

      onStateChange(nextState);
      setActiveTab('edit');
      setCreateVersionName('');
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

    if (hasUnsavedChanges) {
      setErrorMessage('Wait for the current draft to finish saving before switching to another version.');
      setIsSelectingVersionId(null);
      return;
    }

    try {
      const nextState = await selectResumeStudioVersion(versionId);

      onStateChange(nextState);
      setActiveTab('edit');
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

      onStateChange(nextState);
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

    if (hasUnsavedChanges || isSaving) {
      setErrorMessage('Wait for the current draft to finish saving before publishing.');
      return;
    }

    setIsPublishing(true);

    try {
      const nextState = await publishResumeStudioVersion();

      onStateChange(nextState);
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

  async function handleOpenVersionsTab() {
    if (isSaving || isCreatingVersion || isDeletingVersionId !== null || isSelectingVersionId !== null) {
      return;
    }

    if (hasUnsavedChanges) {
      const liveDraft = liveDraftRef.current;

      if (!liveDraft) {
        return;
      }

      const savedState = await saveDraftValues(liveDraft);

      if (!savedState) {
        return;
      }
    }

    setActiveTab('versions');
  }

  async function handleUploadPhoto(file: File) {
    setErrorMessage(null);
    setStatusMessage(null);
    setIsUploadingPhoto(true);

    try {
      const nextPhoto = await uploadResumeStudioPhoto({
        bytesBase64: await readFileAsBase64(file),
        fileName: file.name,
      });

      form.setValue('basics.photoSrc', nextPhoto.src, { shouldDirty: true });
      setStatusMessage('Portrait uploaded. Resume Studio will save it locally.');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Could not upload the portrait.'
      );
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  async function handleOpenStateChange(nextOpen: boolean) {
    if (nextOpen) {
      onOpenChange(true);
      return;
    }

    let nextState = state;

    if (hasUnsavedChanges) {
      const liveDraft = liveDraftRef.current;

      if (!persistedDraft || !liveDraft) {
        return;
      }

      const savedState = await saveDraftValues(liveDraft);

      if (!savedState) {
        return;
      }

      nextState = savedState;
    }

    publishResumeStudioPreview(nextState.publishedDraft || nextState.draft!);
    setActiveTab('edit');
    onStateChange(nextState);
    onOpenChange(false);
  }

  return {
    activeTab,
    autosaveStatusLabel,
    canCreateVersion,
    canPublish,
    createVersionName,
    currentStep,
    errorMessage,
    form,
    handleCreateVersion,
    handleDeleteVersion,
    handleOpenStateChange,
    handleOpenVersionsTab,
    handlePublishVersion,
    handleSelectVersion,
    handleUploadPhoto,
    isCreatingVersion,
    isDeletingVersionId,
    isSelectingVersionId,
    isUploadingPhoto,
    previewData,
    publishButtonLabel,
    setActiveTab,
    setCreateVersionName,
    setCurrentStep,
    scheduleStructuralDraftSync,
    statusMessage,
  };
}
