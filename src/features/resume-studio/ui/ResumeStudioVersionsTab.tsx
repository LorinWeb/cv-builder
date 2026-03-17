import { format } from 'date-fns';

import { ResumeStudioSectionCard } from './form-fields';
import type { ResumeVersionSummary } from '../types';

interface ResumeStudioVersionsTabProps {
  activeVersionId: number | null;
  canCreateVersion: boolean;
  createVersionName: string;
  hasUnpublishedChanges: boolean;
  isCreatingVersion: boolean;
  isDeletingVersionId: number | null;
  isSelectingVersionId: number | null;
  publishedVersionId: number | null;
  onCreateVersionNameChange: (value: string) => void;
  onCreateVersion: () => void;
  onDeleteVersion: (versionId: number) => void;
  onSelectVersion: (versionId: number) => void;
  versions: ResumeVersionSummary[];
}

export function ResumeStudioVersionsTab({
  activeVersionId,
  canCreateVersion,
  createVersionName,
  hasUnpublishedChanges,
  isCreatingVersion,
  isDeletingVersionId,
  isSelectingVersionId,
  publishedVersionId,
  onCreateVersion,
  onCreateVersionNameChange,
  onDeleteVersion,
  onSelectVersion,
  versions,
}: ResumeStudioVersionsTabProps) {
  return (
    <div className="space-y-4">
      <ResumeStudioSectionCard title="Create a version">
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            data-testid="resume-studio-version-name"
            value={createVersionName}
            onChange={(event) => onCreateVersionNameChange(event.target.value)}
            placeholder="Spring 2026 product CV"
            className="w-full rounded-2xl border border-[rgba(74,127,122,0.25)] bg-white px-3.5 py-2.5 text-sm text-[#17312a] outline-none transition focus:border-(--color-primary) focus:ring-2 focus:ring-[rgba(1,135,65,0.15)]"
          />
          <button
            data-testid="resume-studio-create-version"
            type="button"
            onClick={onCreateVersion}
            disabled={!canCreateVersion || isCreatingVersion}
            className="rounded-full bg-(--color-primary) px-5 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCreatingVersion ? 'Creating…' : 'Create version'}
          </button>
        </div>
        {!canCreateVersion ? (
          <p className="m-0 text-xs leading-5 text-(--color-secondary)">
            Wait for the current version to finish saving before creating another one.
          </p>
        ) : null}
      </ResumeStudioSectionCard>

      <ResumeStudioSectionCard title="Saved versions">
        {versions.length === 0 ? (
          <p className="m-0 text-sm leading-6 text-(--color-secondary)">
            No versions yet. Save your resume, then create variants here.
          </p>
        ) : (
          <ul data-testid="resume-studio-versions" className="m-0 list-none space-y-3 p-0">
            {versions.map((version) => (
              <li
                key={version.id}
                data-testid={`resume-studio-version-item-${version.id}`}
                className="flex flex-col gap-3 rounded-2xl border border-[rgba(74,127,122,0.14)] bg-[rgba(242,246,241,0.76)] p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="m-0 flex items-center gap-2 text-sm font-medium text-(--color-primary)">
                    <span>{version.name}</span>
                    {version.id === publishedVersionId ? (
                      <span className="rounded-full bg-[rgba(12,94,78,0.12)] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#0c5e4e]">
                        Published
                      </span>
                    ) : null}
                    {version.id === activeVersionId ? (
                      <span className="rounded-full bg-[rgba(1,135,65,0.12)] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-(--color-primary)">
                        Editing
                      </span>
                    ) : null}
                    {version.id === activeVersionId && hasUnpublishedChanges ? (
                      <span className="rounded-full bg-[rgba(176,76,18,0.12)] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8a470d]">
                        Unpublished changes
                      </span>
                    ) : null}
                  </p>
                  <p className="m-0 text-xs leading-5 text-(--color-secondary)">
                    Created {format(new Date(version.createdAt), 'PPP p')}
                  </p>
                  <p className="m-0 text-xs leading-5 text-(--color-secondary)">
                    Updated {format(new Date(version.updatedAt), 'PPP p')}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectVersion(version.id)}
                    disabled={
                      isSelectingVersionId === version.id ||
                      isDeletingVersionId === version.id ||
                      activeVersionId === version.id
                    }
                    className="rounded-full border border-(--color-header-border) bg-white px-4 py-2 text-sm font-medium text-(--color-primary) disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {activeVersionId === version.id
                      ? 'Editing'
                      : isSelectingVersionId === version.id
                        ? 'Opening…'
                        : 'Edit version'}
                  </button>
                  {!version.isPublished ? (
                    <button
                      type="button"
                      onClick={() => onDeleteVersion(version.id)}
                      disabled={
                        isDeletingVersionId === version.id ||
                        isSelectingVersionId === version.id
                      }
                      className="rounded-full border border-[rgba(155,44,44,0.24)] bg-[rgba(155,44,44,0.08)] px-4 py-2 text-sm font-medium text-[#9b2c2c] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isDeletingVersionId === version.id ? 'Deleting…' : 'Delete'}
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </ResumeStudioSectionCard>
    </div>
  );
}
