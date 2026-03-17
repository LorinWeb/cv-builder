import { Dialog } from '@base-ui/react/dialog';
import { FormProvider } from 'react-hook-form';

import type { ResumeStudioState } from '../types';
import { ResumeStudioEditTab } from './ResumeStudioEditTab';
import { ResumeStudioPreviewFrame } from './ResumeStudioPreviewFrame';
import { ResumeStudioVersionsTab } from './ResumeStudioVersionsTab';
import { ResumeStudioButton } from './primitives';
import { useResumeStudioDialogController } from './useResumeStudioDialogController';

interface ResumeStudioDialogProps {
  onOpenChange: (open: boolean) => void;
  onStateChange: (state: ResumeStudioState) => void;
  open: boolean;
  state: ResumeStudioState;
}

export function ResumeStudioDialog({
  onOpenChange,
  onStateChange,
  open,
  state,
}: ResumeStudioDialogProps) {
  const {
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
  } = useResumeStudioDialogController({
    onOpenChange,
    onStateChange,
    open,
    state,
  });

  if (!previewData) {
    return null;
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenStateChange}>
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
            <Dialog.Close render={<ResumeStudioButton>Close</ResumeStudioButton>} />
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
                    canCreateVersion={canCreateVersion}
                    createVersionName={createVersionName}
                    hasUnpublishedChanges={state.hasUnpublishedChanges}
                    isCreatingVersion={isCreatingVersion}
                    isDeletingVersionId={isDeletingVersionId}
                    isSelectingVersionId={isSelectingVersionId}
                    publishedVersionId={state.publishedVersionId}
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
              <p
                data-testid="resume-studio-autosave-status"
                className="m-0 text-sm font-medium text-(--color-primary)"
              >
                {autosaveStatusLabel}
              </p>

              <div className="flex flex-wrap gap-2">
                {activeTab === 'edit' ? (
                  <>
                    <ResumeStudioButton
                      data-testid="resume-studio-publish"
                      onClick={handlePublishVersion}
                      disabled={!canPublish}
                      variant="primary"
                    >
                      {publishButtonLabel}
                    </ResumeStudioButton>
                    <ResumeStudioButton
                      data-testid="resume-studio-see-versions"
                      onClick={() => setActiveTab('versions')}
                    >
                      Manage Saved Versions
                    </ResumeStudioButton>
                  </>
                ) : (
                  <ResumeStudioButton
                    data-testid="resume-studio-back-to-edit"
                    onClick={() => setActiveTab('edit')}
                  >
                    Back to edit
                  </ResumeStudioButton>
                )}
              </div>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
