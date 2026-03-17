import { X } from 'lucide-react';
import { useFieldArray, useFormContext, useWatch, type Path } from 'react-hook-form';

import { createEmptyResumeStudioProgressionRoleDraft } from '../../draft-factories';
import type { ResumeStudioDraft } from '../../types';
import { ResumeStudioInputField } from '../form-fields';
import { ResumeStudioButton, ResumeStudioCard } from '../primitives';
import { ResumeStudioWorkRoleFields } from './ResumeStudioWorkRoleFields';

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
    <ResumeStudioCard
      data-testid="resume-studio-work-group"
      className="relative"
    >
      <ResumeStudioButton
        aria-label={`Remove progression group ${index + 1}`}
        onClick={onRemove}
        size="icon"
        variant="dangerSolid"
        className="absolute right-4 top-4"
      >
        <X className="h-3.5 w-3.5" />
      </ResumeStudioButton>

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
          <ResumeStudioCard
            key={field.id}
            data-testid="resume-studio-work-group-role"
            tone="nested"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <h5 className="m-0 text-sm font-medium text-(--color-primary)">
                Role {roleIndex + 1}
              </h5>
              {fields.length > 1 ? (
                <ResumeStudioButton
                  onClick={() => remove(roleIndex)}
                  size="compact"
                  variant="dangerOutline"
                >
                  Remove role
                </ResumeStudioButton>
              ) : null}
            </div>

            <ResumeStudioWorkRoleFields
              basePath={`${progressionPath}.${roleIndex}`}
              includeCompanyField={false}
            />
          </ResumeStudioCard>
        ))}
      </div>

      <div className="mt-4">
        <ResumeStudioButton
          onClick={() =>
            append(createEmptyResumeStudioProgressionRoleDraft(groupCompany.trim()))
          }
        >
          Add role to progression
        </ResumeStudioButton>
      </div>
    </ResumeStudioCard>
  );
}
