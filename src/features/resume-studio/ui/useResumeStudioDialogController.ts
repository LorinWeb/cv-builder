import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { useForm, useWatch, type Path } from 'react-hook-form';

import { applyResumeStudioDraft, toResumeStudioDraft } from '../draft';
import { RESUME_STUDIO_AUTOSAVE_DELAY_MS } from '../constants';
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

function serializeResumeStudioDraft(draft: ResumeStudioDraft) {
  return JSON.stringify(draft);
}

function mergeResumeStudioDraft(
  source: ResumeStudioDraft,
  patch: Partial<ResumeStudioDraft>
): ResumeStudioDraft {
  const nextBasics = {
    ...source.basics,
  };

  for (const [key, value] of Object.entries(patch.basics || {})) {
    if (value !== undefined) {
      nextBasics[key as keyof ResumeStudioDraft['basics']] = value;
    }
  }

  return {
    basics: nextBasics,
    education: patch.education ?? source.education,
    impact: patch.impact ?? source.impact,
    skills: patch.skills ?? source.skills,
    work: patch.work ?? source.work,
  };
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
  const watchedDraft = useWatch({ control: form.control });
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
  const lastSavedDraftSignatureRef = useRef<string | null>(null);
  const persistedDraft = state.draft ? toResumeStudioDraft(state.draft) : null;

  void watchedDraft;
  const liveDraft = persistedDraft
    ? mergeResumeStudioDraft(persistedDraft, form.getValues() as Partial<ResumeStudioDraft>)
    : null;
  const liveDraftSignature = liveDraft ? serializeResumeStudioDraft(liveDraft) : null;

  if (!lastSavedDraftSignatureRef.current && persistedDraft) {
    lastSavedDraftSignatureRef.current = serializeResumeStudioDraft(persistedDraft);
  }

  const hasUnsavedChanges = Boolean(
    liveDraftSignature && liveDraftSignature !== lastSavedDraftSignatureRef.current
  );
  const previewData =
    state.draft && liveDraft ? applyResumeStudioDraft(state.draft, liveDraft) : null;
  const autosaveStatusLabel = getAutosaveStatusLabel({
    errorMessage,
    hasUnsavedChanges,
    isSaving,
    state,
  });
  const canCreateVersion = !hasUnsavedChanges && !isSaving;
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
    setErrorMessage(null);
    setIsSaving(true);

    try {
      const nextState = await saveResumeStudioDraft({
        draft: applyResumeStudioDraft(state.draft!, values),
      });
      const savedDraft = toResumeStudioDraft(nextState.draft!);

      form.clearErrors();
      lastSavedDraftSignatureRef.current = serializeResumeStudioDraft(savedDraft);
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

  useEffect(() => {
    if (!state.draft) {
      lastSavedDraftSignatureRef.current = null;
      return;
    }

    const nextDraft = toResumeStudioDraft(state.draft);
    const nextDraftSignature = serializeResumeStudioDraft(nextDraft);
    const currentDraftSignature = serializeResumeStudioDraft(
      mergeResumeStudioDraft(nextDraft, form.getValues() as Partial<ResumeStudioDraft>)
    );

    lastSavedDraftSignatureRef.current = nextDraftSignature;

    if (nextDraftSignature !== currentDraftSignature) {
      form.reset(nextDraft);
    }
  }, [form, state.activeVersionId, state.draft, state.draftUpdatedAt]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.sessionStorage.setItem('resume-studio-step', currentStep);
  }, [currentStep]);

  useEffect(() => {
    if (!open || !state.draft) {
      return;
    }

    publishResumeStudioPreview(
      applyResumeStudioDraft(
        state.draft,
        mergeResumeStudioDraft(
          toResumeStudioDraft(state.draft),
          form.getValues() as Partial<ResumeStudioDraft>
        )
      )
    );
  }, [form, liveDraftSignature, open, state.activeVersionId, state.draft, state.draftUpdatedAt]);

  useEffect(() => {
    if (
      !open ||
      !state.draft ||
      !liveDraftSignature ||
      !hasUnsavedChanges ||
      isSaving ||
      isCreatingVersion ||
      isDeletingVersionId !== null ||
      isSelectingVersionId !== null ||
      isPublishing
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const sourceDraft = state.draft;

      if (!sourceDraft) {
        return;
      }

      void saveDraftValues(
        mergeResumeStudioDraft(
          toResumeStudioDraft(sourceDraft),
          form.getValues() as Partial<ResumeStudioDraft>
        )
      );
    }, RESUME_STUDIO_AUTOSAVE_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    hasUnsavedChanges,
    isCreatingVersion,
    isDeletingVersionId,
    isPublishing,
    isSaving,
    isSelectingVersionId,
    liveDraftSignature,
    open,
    form,
    saveDraftValues,
    state.activeVersionId,
    state.draft,
    state.draftUpdatedAt,
  ]);

  async function handleCreateVersion() {
    setErrorMessage(null);
    setStatusMessage(null);

    if (hasUnsavedChanges) {
      setErrorMessage('Wait for the current draft to finish saving before creating another version.');
      return;
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
      if (!persistedDraft) {
        return;
      }

      const savedState = await saveDraftValues(
        mergeResumeStudioDraft(
          persistedDraft,
          form.getValues() as Partial<ResumeStudioDraft>
        )
      );

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
    statusMessage,
  };
}
