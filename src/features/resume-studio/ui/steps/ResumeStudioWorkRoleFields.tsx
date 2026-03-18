import { memo } from 'react';
import { useFormContext, type Path } from 'react-hook-form';

import { ListItemsEditor } from '../ListItemsEditor';
import { TextEditor } from '../TextEditor';
import { ResumeStudioInputField } from '../form-fields';
import { ResumeStudioButton } from '../primitives';
import type { ResumeStudioDraft } from '../../types';

interface ResumeStudioWorkRoleFieldsProps {
  basePath: string;
  includeCompanyField?: boolean;
  includeWebsiteField?: boolean;
  onRemove?: () => void;
  removeLabel?: string;
}

export const ResumeStudioWorkRoleFields = memo(function ResumeStudioWorkRoleFields({
  basePath,
  includeCompanyField = true,
  includeWebsiteField = false,
  onRemove,
  removeLabel = 'Remove role',
}: ResumeStudioWorkRoleFieldsProps) {
  const { register } = useFormContext<ResumeStudioDraft>();

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {includeCompanyField ? (
          <ResumeStudioInputField
            label="Company"
            name={`${basePath}.company` as Path<ResumeStudioDraft>}
            placeholder="Acme Systems"
          />
        ) : null}
        <ResumeStudioInputField
          label="Role"
          name={`${basePath}.position` as Path<ResumeStudioDraft>}
          placeholder="Staff Engineer"
        />
        <ResumeStudioInputField
          label="Start date"
          name={`${basePath}.startDate` as Path<ResumeStudioDraft>}
          placeholder="2024-01-01"
        />
        <ResumeStudioInputField
          label="End date"
          name={`${basePath}.endDate` as Path<ResumeStudioDraft>}
          placeholder="Leave blank for current role"
        />
        {includeWebsiteField ? (
          <ResumeStudioInputField
            label="Website"
            name={`${basePath}.website` as Path<ResumeStudioDraft>}
            placeholder="https://example.com"
            type="url"
          />
        ) : null}
        <label className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-(--color-primary)">
          <input
            {...register(`${basePath}.isContract` as Path<ResumeStudioDraft>)}
            type="checkbox"
            className="h-4 w-4 rounded border-[rgba(74,127,122,0.35)]"
          />
          Contract role
        </label>
      </div>

      <div className="mt-4">
        <TextEditor
          description="Markdown supported."
          label="Summary"
          minRows={4}
          name={`${basePath}.summary` as Path<ResumeStudioDraft>}
          placeholder="Summarize scope, ownership, and the kind of impact you had."
        />
      </div>

      <div className="mt-4">
        <ListItemsEditor
          addLabel="Add highlight"
          emptyCopy="Add the outcomes, initiatives, or responsibilities that matter most."
          itemLabel="highlight"
          label="Highlights"
          name={`${basePath}.highlights` as never}
          placeholder="Improved reliability, reduced lead time, or clarified architecture direction."
        />
      </div>

      {onRemove ? (
        <div className="mt-4 flex justify-end">
          <ResumeStudioButton
            onClick={onRemove}
            size="compact"
            variant="dangerOutline"
          >
            {removeLabel}
          </ResumeStudioButton>
        </div>
      ) : null}
    </>
  );
});
