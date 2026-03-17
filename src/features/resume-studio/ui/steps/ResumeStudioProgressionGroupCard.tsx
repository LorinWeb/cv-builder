import { useFieldArray, useFormContext, useWatch, type Path } from 'react-hook-form';

import { createEmptyResumeStudioProgressionRoleDraft } from '../../work-draft';
import type { ResumeStudioDraft } from '../../types';
import { ResumeStudioInputField } from '../form-fields';
import { ResumeStudioWorkRoleFields } from './ResumeStudioWorkRoleFields';

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5 stroke-current">
      <path
        d="M4 4l8 8M12 4 4 12"
        fill="none"
        strokeLinecap="round"
        strokeWidth="1.75"
      />
    </svg>
  );
}

interface ResumeStudioProgressionGroupCardProps {
  index: number;
  onRemove: () => void;
}

export function ResumeStudioProgressionGroupCard({
  index,
  onRemove,
}: ResumeStudioProgressionGroupCardProps) {
  const { control } = useFormContext<ResumeStudioDraft>();
  const progressionPath = `work.${index}.progression` as const;
  const watchedCompany = useWatch({
    control,
    name: `work.${index}.company` as Path<ResumeStudioDraft>,
  });
  const groupCompany = typeof watchedCompany === 'string' ? watchedCompany : '';
  const { append, fields, remove } = useFieldArray({
    control,
    name: progressionPath as never,
  });

  return (
    <div
      data-testid="resume-studio-work-group"
      className="relative rounded-3xl border border-[rgba(74,127,122,0.14)] bg-[rgba(242,246,241,0.76)] p-4"
    >
      <button
        type="button"
        aria-label={`Remove progression group ${index + 1}`}
        onClick={onRemove}
        className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#c53a3a] text-white transition hover:bg-[#ab2c2c]"
      >
        <CloseIcon />
      </button>

      <div className="pr-10">
        <h4 className="m-0 text-sm font-medium uppercase tracking-[0.08em] text-(--color-secondary)">
          Company progression
        </h4>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <ResumeStudioInputField
            label="Company"
            name={`work.${index}.company` as Path<ResumeStudioDraft>}
            placeholder="Acme Systems"
          />
          <ResumeStudioInputField
            label="Website"
            name={`work.${index}.website` as Path<ResumeStudioDraft>}
            placeholder="https://example.com"
            type="url"
          />
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {fields.map((field, roleIndex) => (
          <div
            key={field.id}
            data-testid="resume-studio-work-group-role"
            className="rounded-3xl border border-[rgba(74,127,122,0.16)] bg-white/85 p-4"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <h5 className="m-0 text-sm font-medium text-(--color-primary)">
                Role {roleIndex + 1}
              </h5>
              {fields.length > 1 ? (
                <button
                  type="button"
                  onClick={() => remove(roleIndex)}
                  className="rounded-full border border-[rgba(155,44,44,0.2)] px-3 py-1.5 text-xs font-medium text-[#9b2c2c]"
                >
                  Remove role
                </button>
              ) : null}
            </div>

            <ResumeStudioWorkRoleFields
              basePath={`${progressionPath}.${roleIndex}`}
              includeCompanyField={false}
            />
          </div>
        ))}
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={() =>
            append(createEmptyResumeStudioProgressionRoleDraft(groupCompany.trim()))
          }
          className="rounded-full border border-(--color-header-border) bg-white px-4 py-2 text-sm font-medium text-(--color-primary)"
        >
          Add role to progression
        </button>
      </div>
    </div>
  );
}
