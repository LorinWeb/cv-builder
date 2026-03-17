import { Dialog } from '@base-ui/react/dialog';
import { FormProvider, useForm, useWatch, type Path } from 'react-hook-form';
import { useEffect, useEffectEvent, useRef, useState } from 'react';

import { applyResumeStudioDraft, toResumeStudioDraft } from '../draft';
import { RESUME_STUDIO_AUTOSAVE_DELAY_MS } from '../constants';
import {
  createResumeStudioVersion,
  deleteResumeStudioVersion,
  publishResumeStudioPreview,
  ResumeStudioApiError,
  saveResumeStudioDraft,
  selectResumeStudioVersion,
  uploadResumeStudioPhoto,
} from '../runtime';
import type { ResumeStudioDraft, ResumeStudioState, ResumeStudioStepId } from '../types';
import { ResumeStudioEditTab } from './ResumeStudioEditTab';
import { ResumeStudioPreviewFrame } from './ResumeStudioPreviewFrame';
import { ResumeStudioVersionsTab } from './ResumeStudioVersionsTab';

interface ResumeStudioDialogProps {
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

export function ResumeStudioDialog({
  onOpenChange,
  onStateChange,
  open,
  state,
}: ResumeStudioDialogProps) {
  const form = useForm<ResumeStudioDraft>({
    defaultValues: state.draft ? toResumeStudioDraft(state.draft) : undefined,
  });
  const watchedDraft = useWatch({ control: form.control });
  const [activeTab, setActiveTab] = useState<'edit' | 'versions'>('edit');
  const [currentStep, setCurrentStep] = useState<ResumeStudioStepId>(readSessionStep);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createVersionName, setCreateVersionName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [isDeletingVersionId, setIsDeletingVersionId] = useState<number | null>(null);
  const [isSelectingVersionId, setIsSelectingVersionId] = useState<number | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const lastSavedDraftSignatureRef = useRef<string | null>(null);
  const persistedDraft = state.draft ? toResumeStudioDraft(state.draft) : null;
  const liveDraft = persistedDraft
    ? mergeResumeStudioDraft(
        persistedDraft,
        form.getValues() as Partial<ResumeStudioDraft>
      )
    : null;
  const liveDraftSignature = liveDraft ? serializeResumeStudioDraft(liveDraft) : null;

  void watchedDraft;

  if (!lastSavedDraftSignatureRef.current && persistedDraft) {
    lastSavedDraftSignatureRef.current = serializeResumeStudioDraft(persistedDraft);
  }

  const hasUnsavedChanges = Boolean(
    liveDraftSignature && liveDraftSignature !== lastSavedDraftSignatureRef.current
  );
  const previewData =
    state.draft && liveDraft ? applyResumeStudioDraft(state.draft, liveDraft) : null;
  const autosaveStatusLabel = errorMessage
    ? 'Autosave needs attention.'
    : isSaving
      ? 'Saving changes…'
      : hasUnsavedChanges
        ? 'Changes pending…'
        : 'All changes saved.';
  const saveDraftValues = useEffectEvent(
    async (values: ResumeStudioDraft, announceSuccess: boolean) => {
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

        if (announceSuccess) {
          setStatusMessage(
            `${nextState.activeVersionName || 'Current version'} saved and synced to src/data/resume.private.json.`
          );
        }
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
      } finally {
        setIsSaving(false);
      }
    }
  );

  useEffect(() => {
    if (!state.draft) {
      lastSavedDraftSignatureRef.current = null;
      return;
    }

    const nextDraft = toResumeStudioDraft(state.draft);
    const nextDraftSignature = serializeResumeStudioDraft(nextDraft);
    const currentDraftSignature = serializeResumeStudioDraft(
      mergeResumeStudioDraft(
        nextDraft,
        form.getValues() as Partial<ResumeStudioDraft>
      )
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
    if (!state.draft) {
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
  }, [form, liveDraftSignature, state.activeVersionId, state.draft, state.draftUpdatedAt]);

  useEffect(() => {
    if (
      !open ||
      !state.draft ||
      !liveDraftSignature ||
      !hasUnsavedChanges ||
      isSaving ||
      isCreatingVersion ||
      isDeletingVersionId !== null ||
      isSelectingVersionId !== null
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void saveDraftValues(
        mergeResumeStudioDraft(
          toResumeStudioDraft(state.draft!),
          form.getValues() as Partial<ResumeStudioDraft>
        ),
        false
      );
    }, RESUME_STUDIO_AUTOSAVE_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    hasUnsavedChanges,
    isCreatingVersion,
    isDeletingVersionId,
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

  if (!state.draft || !liveDraft || !previewData) {
    return null;
  }

  async function handleCreateVersion() {
    setErrorMessage(null);
    setStatusMessage(null);

    if (hasUnsavedChanges) {
      setErrorMessage('Wait for the current version to finish saving before creating another one.');
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
      setErrorMessage('Wait for the current version to finish saving before switching to another one.');
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
      setStatusMessage('Portrait uploaded. Resume Studio will save it automatically.');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Could not upload the portrait.'
      );
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-[rgba(18,40,35,0.48)] backdrop-blur-[2px]" />
        <Dialog.Popup
          data-testid="resume-studio-dialog"
          className="fixed inset-4 z-60 mx-auto my-6 flex max-h-[calc(100vh-48px)] w-[min(1040px,100%)] flex-col overflow-hidden rounded-4xl bg-[linear-gradient(180deg,rgba(244,249,244,0.98),rgba(235,244,240,0.96))] shadow-[0_40px_120px_-48px_rgba(11,37,31,0.55)]"
        >
          <div className="flex items-start justify-between gap-4 border-b border-[rgba(74,127,122,0.14)] px-5 py-4 md:px-6">
            <div>
              <Dialog.Title className="m-0 text-xl font-medium text-(--color-primary)">
                Resume Studio
              </Dialog.Title>
              {state.activeVersionName ? (
                <p className="mt-2 text-xs font-medium uppercase tracking-[0.08em] text-(--color-secondary)">
                  Editing {state.activeVersionName}
                </p>
              ) : null}
            </div>
            <Dialog.Close className="rounded-full border border-(--color-header-border) bg-white px-3 py-1.5 text-sm font-medium text-(--color-primary)">
              Close
            </Dialog.Close>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-6">
            {statusMessage ? (
              <p className="mb-4 rounded-2xl border border-[rgba(1,135,65,0.16)] bg-[rgba(1,135,65,0.08)] px-4 py-3 text-sm text-(--color-primary)">
                {statusMessage}
              </p>
            ) : null}
            {errorMessage ? (
              <p className="mb-4 rounded-2xl border border-[rgba(155,44,44,0.16)] bg-[rgba(155,44,44,0.08)] px-4 py-3 text-sm text-[#9b2c2c]">
                {errorMessage}
              </p>
            ) : null}

            <div className="grid gap-5 lg:grid-cols-2">
              <div className="min-w-0">
                {activeTab === 'edit' ? (
                  <FormProvider {...form}>
                    <ResumeStudioEditTab
                      currentStep={currentStep}
                      isUploadingPhoto={isUploadingPhoto}
                      onStepChange={setCurrentStep}
                      onUploadPhoto={handleUploadPhoto}
                    />
                  </FormProvider>
                ) : (
                  <ResumeStudioVersionsTab
                    activeVersionId={state.activeVersionId}
                    canCreateVersion={!hasUnsavedChanges && !isSaving}
                    createVersionName={createVersionName}
                    isCreatingVersion={isCreatingVersion}
                    isDeletingVersionId={isDeletingVersionId}
                    isSelectingVersionId={isSelectingVersionId}
                    onCreateVersion={handleCreateVersion}
                    onCreateVersionNameChange={setCreateVersionName}
                    onDeleteVersion={handleDeleteVersion}
                    onSelectVersion={handleSelectVersion}
                    versions={state.versions}
                  />
                )}
              </div>

              <div className="min-w-0 lg:sticky lg:top-0 lg:self-start">
                <ResumeStudioPreviewFrame data={previewData} />
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 border-t border-[rgba(74,127,122,0.14)] bg-[linear-gradient(180deg,rgba(244,249,244,0.98),rgba(235,244,240,0.99))] px-5 py-4 md:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p
                  data-testid="resume-studio-autosave-status"
                  className="m-0 text-sm font-medium text-(--color-primary)"
                >
                  {autosaveStatusLabel}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {activeTab === 'edit' ? (
                  <button
                    data-testid="resume-studio-see-versions"
                    type="button"
                    onClick={() => setActiveTab('versions')}
                    className="rounded-full border border-(--color-header-border) bg-white px-4 py-2 text-sm font-medium text-(--color-primary)"
                  >
                    Manage Saved Versions
                  </button>
                ) : (
                  <button
                    data-testid="resume-studio-back-to-edit"
                    type="button"
                    onClick={() => setActiveTab('edit')}
                    className="rounded-full border border-(--color-header-border) bg-white px-4 py-2 text-sm font-medium text-(--color-primary)"
                  >
                    Back to edit
                  </button>
                )}
              </div>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
