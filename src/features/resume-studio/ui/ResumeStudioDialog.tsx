import { Dialog } from '@base-ui/react/dialog';
import { Popover } from '@base-ui/react/popover';
import { useRef, type ButtonHTMLAttributes, type InputHTMLAttributes } from 'react';
import { FormProvider } from 'react-hook-form';

import { joinClassNames } from '../../../helpers/classNames';
import type { ResumeStudioState, ResumeVersionSummary } from '../types';
import { ResumeStudioPreviewFrame } from './ResumeStudioPreviewFrame';
import { StudioScrollArea } from './StudioScrollArea';
import { TextEditor } from './TextEditor';
import { useResumeStudioDialogController } from './useResumeStudioDialogController';
import './resume-studio.css';

interface ResumeStudioDialogProps {
  onOpenChange: (open: boolean) => void;
  onStateChange: (state: ResumeStudioState) => void;
  open: boolean;
  state: ResumeStudioState;
}

interface StudioButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: 'danger' | 'primary' | 'secondary';
}

function StudioButton({
  children,
  className,
  tone = 'secondary',
  type = 'button',
  ...props
}: StudioButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={joinClassNames(
        'resume-studio-button rounded-full px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
        tone === 'primary'
          ? 'resume-studio-button-primary'
          : tone === 'danger'
            ? 'resume-studio-button-danger'
            : 'resume-studio-button-secondary',
        className
      )}
    >
      {children}
    </button>
  );
}

function StudioInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={joinClassNames(
        'resume-studio-input w-full rounded-2xl border px-3 py-2 text-sm outline-none transition',
        props.className
      )}
    />
  );
}

interface VersionsMenuProps {
  activeVersionId: number | null;
  canCreateVersion: boolean;
  createVersionName: string;
  isCreatingVersion: boolean;
  isDeletingVersionId: number | null;
  isOpen: boolean;
  isSelectingVersionId: number | null;
  onCreateVersion: () => void;
  onCreateVersionNameChange: (value: string) => void;
  onDeleteVersion: (versionId: number) => void;
  onOpenChange: (open: boolean) => void;
  onSelectVersion: (versionId: number) => void;
  versions: ResumeVersionSummary[];
}

function VersionsMenu({
  activeVersionId,
  canCreateVersion,
  createVersionName,
  isCreatingVersion,
  isDeletingVersionId,
  isOpen,
  isSelectingVersionId,
  onCreateVersion,
  onCreateVersionNameChange,
  onDeleteVersion,
  onOpenChange,
  onSelectVersion,
  versions,
}: VersionsMenuProps) {
  return (
    <Popover.Root open={isOpen} onOpenChange={(nextOpen) => onOpenChange(nextOpen)}>
      <Popover.Trigger
        render={<StudioButton data-testid="resume-studio-versions-toggle">Versions</StudioButton>}
      />

      <Popover.Portal>
        <Popover.Positioner
          align="end"
          collisionPadding={16}
          side="bottom"
          sideOffset={12}
          className="z-70 outline-none"
        >
          <Popover.Popup
            data-testid="resume-studio-versions-menu"
            initialFocus={false}
            className="resume-studio-menu w-[min(28rem,calc(100vw-2rem))] rounded-[1.75rem] border p-4"
          >
            <div className="flex gap-2">
              <label htmlFor="resume-studio-version-name" className="sr-only">
                Version name
              </label>
              <StudioInput
                id="resume-studio-version-name"
                data-testid="resume-studio-version-name"
                value={createVersionName}
                placeholder="Version name"
                onChange={(event) => onCreateVersionNameChange(event.target.value)}
              />
              <StudioButton
                data-testid="resume-studio-create-version"
                onClick={onCreateVersion}
                disabled={!canCreateVersion || createVersionName.trim().length === 0}
              >
                {isCreatingVersion ? 'Creating...' : 'Create'}
              </StudioButton>
            </div>

            <div className="mt-4 max-h-96 space-y-2 overflow-y-auto">
              {versions.map((version) => {
                const isActive = version.id === activeVersionId;

                return (
                  <div
                    key={version.id}
                    data-testid={`resume-studio-version-item-${version.id}`}
                    className={joinClassNames(
                      'rounded-[1.35rem] border px-4 py-3 transition-colors',
                      isActive
                        ? 'border-(--resume-studio-accent) bg-(--resume-studio-accent-soft)'
                        : 'border-(--resume-studio-border) bg-[rgba(255,255,255,0.62)] hover:bg-[rgba(255,255,255,0.82)]'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="m-0 truncate text-sm font-medium text-(--resume-studio-text)">
                          {version.name}
                        </p>
                        <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.12em] text-(--resume-studio-text-muted)">
                          {version.isPublished ? 'Published' : 'Local draft'}
                          {isActive ? ' · Active' : ''}
                        </p>
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <StudioButton
                          onClick={() => onSelectVersion(version.id)}
                          disabled={isActive || isSelectingVersionId === version.id}
                        >
                          {isSelectingVersionId === version.id
                            ? 'Opening...'
                            : isActive
                              ? 'Current'
                              : 'Open'}
                        </StudioButton>
                        {!version.isPublished ? (
                          <StudioButton
                            tone="danger"
                            onClick={() => onDeleteVersion(version.id)}
                            disabled={isDeletingVersionId === version.id}
                          >
                            {isDeletingVersionId === version.id ? 'Deleting...' : 'Delete'}
                          </StudioButton>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

export function ResumeStudioDialog({
  onOpenChange,
  onStateChange,
  open,
  state,
}: ResumeStudioDialogProps) {
  const editorViewportRef = useRef<HTMLDivElement | null>(null);
  const {
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
    previewData,
    publishButtonLabel,
    setMarkdown,
    setCreateVersionName,
    setIsVersionsMenuOpen,
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
    <Dialog.Root
      modal="trap-focus"
      open={open}
      onOpenChange={handleOpenStateChange}
    >
      <Dialog.Portal>
        <Dialog.Popup
          data-testid="resume-studio-dialog"
          className="resume-studio-dialog fixed inset-0 z-60 flex h-screen flex-col"
        >
          <div className="resume-studio-topbar flex flex-wrap items-start gap-4 border-b px-6 py-4">
            <div className="min-w-0 flex-1">
              <Dialog.Title className="sr-only">
                Resume Studio
              </Dialog.Title>
              <p
                data-testid="resume-studio-active-version"
                className="truncate text-[0.98rem] font-medium tracking-[-0.015em] text-(--resume-studio-text)"
              >
                {state.activeVersionName || 'Untitled version'}
              </p>
              {statusMessage ? (
                <p className="mt-1 text-sm text-(--resume-studio-accent-strong)">
                  {statusMessage}
                </p>
              ) : null}
              {errorMessage ? (
                <p
                  data-testid="resume-studio-error"
                  className="mt-1 text-sm text-[#a24c4c]"
                >
                  {errorMessage}
                </p>
              ) : null}
            </div>

            <p
              data-testid="resume-studio-autosave-status"
              className="resume-studio-status-chip order-3 rounded-full px-3 py-1 text-xs font-medium tracking-[0.01em] sm:order-0"
            >
              {autosaveStatusLabel}
            </p>

            <div className="ml-auto flex shrink-0 items-center gap-2">
              <VersionsMenu
                activeVersionId={state.activeVersionId}
                canCreateVersion={canCreateVersion}
                createVersionName={createVersionName}
                isCreatingVersion={isCreatingVersion}
                isDeletingVersionId={isDeletingVersionId}
                isOpen={isVersionsMenuOpen}
                isSelectingVersionId={isSelectingVersionId}
                onCreateVersion={handleCreateVersion}
                onCreateVersionNameChange={setCreateVersionName}
                onDeleteVersion={handleDeleteVersion}
                onOpenChange={setIsVersionsMenuOpen}
                onSelectVersion={handleSelectVersion}
                versions={state.versions}
              />

              <StudioButton
                data-testid="resume-studio-publish"
                onClick={handlePublishVersion}
                disabled={!canPublish}
                tone="primary"
              >
                {publishButtonLabel}
              </StudioButton>

              <Dialog.Close
                render={<StudioButton data-testid="resume-studio-close">Close</StudioButton>}
              />
            </div>
          </div>

          <div
            data-testid="resume-studio-workspace"
            className="resume-studio-workspace grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)]"
          >
            <StudioScrollArea
              rootClassName="resume-studio-editor-pane"
              rootTestId="resume-studio-editor-pane"
              contentClassName="min-h-full"
              viewportClassName="overflow-y-auto overflow-x-hidden"
              viewportRef={editorViewportRef}
              viewportTestId="resume-studio-editor-scroll-area-viewport"
            >
              <FormProvider {...form}>
                <TextEditor
                  hideLabel
                  label="Manual markdown"
                  layout="document"
                  name="markdown"
                  onValueChange={setMarkdown}
                  placeholder="# Your Name"
                  rootClassName="min-h-full"
                  testId="resume-studio-field-markdown"
                />
              </FormProvider>
            </StudioScrollArea>

            <div
              data-testid="resume-studio-pane-divider"
              className="w-px bg-(--resume-studio-border)"
            />

            <div className="min-h-0 bg-(--resume-studio-surface-muted)">
              <ResumeStudioPreviewFrame
                data={previewData}
                editorViewportRef={editorViewportRef}
              />
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
