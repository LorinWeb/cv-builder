import { useFieldArray, useFormContext } from 'react-hook-form';

import { ResumeStudioTextListEditor } from '../ResumeStudioTextListEditor';
import { ResumeStudioInputField, ResumeStudioSectionCard, ResumeStudioTextAreaField } from '../form-fields';
import type { ResumeStudioDraft } from '../../types';

interface ResumeStudioExperienceStepProps {
  isReadOnly: boolean;
  warningMessage?: string;
}

export function ResumeStudioExperienceStep({
  isReadOnly,
  warningMessage,
}: ResumeStudioExperienceStepProps) {
  const { control, register } = useFormContext<ResumeStudioDraft>();
  const { append, fields, remove } = useFieldArray({
    control,
    name: 'work',
  });

  if (isReadOnly) {
    return (
      <ResumeStudioSectionCard title="Experience">
        <p className="m-0 text-sm leading-6 text-(--color-secondary)">
          {warningMessage}
        </p>
      </ResumeStudioSectionCard>
    );
  }

  return (
    <ResumeStudioSectionCard title="Experience">
      <div className="space-y-4">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="rounded-3xl border border-[rgba(74,127,122,0.14)] bg-[rgba(242,246,241,0.76)] p-4"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <ResumeStudioInputField
                label="Company"
                name={`work.${index}.company`}
                placeholder="Acme Systems"
              />
              <ResumeStudioInputField
                label="Role"
                name={`work.${index}.position`}
                placeholder="Staff Engineer"
              />
              <ResumeStudioInputField
                label="Start date"
                name={`work.${index}.startDate`}
                placeholder="2024-01-01"
              />
              <ResumeStudioInputField
                label="End date"
                name={`work.${index}.endDate`}
                placeholder="Leave blank for current role"
              />
              <ResumeStudioInputField
                label="Website"
                name={`work.${index}.website`}
                placeholder="https://example.com"
                type="url"
              />
              <label className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-(--color-primary)">
                <input
                  {...register(`work.${index}.isContract`)}
                  type="checkbox"
                  className="h-4 w-4 rounded border-[rgba(74,127,122,0.35)]"
                />
                Contract role
              </label>
            </div>

            <div className="mt-4">
              <ResumeStudioTextAreaField
                label="Summary"
                name={`work.${index}.summary`}
                placeholder="Summarize scope, ownership, and the kind of impact you had."
                rows={4}
              />
            </div>

            <div className="mt-4">
              <ResumeStudioTextListEditor
                addLabel="Add highlight"
                emptyCopy="Add the outcomes, initiatives, or responsibilities that matter most."
                label="Highlights"
                name={`work.${index}.highlights`}
                placeholder="Improved reliability, reduced lead time, or clarified architecture direction."
              />
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => remove(index)}
                className="rounded-full border border-[rgba(155,44,44,0.2)] px-3 py-1.5 text-xs font-medium text-[#9b2c2c]"
              >
                Remove role
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() =>
          append({
            company: '',
            endDate: '',
            highlights: [],
            isContract: false,
            position: '',
            startDate: '',
            summary: '',
            website: '',
          })
        }
        className="rounded-full border border-(--color-header-border) bg-white px-4 py-2 text-sm font-medium text-(--color-primary)"
      >
        Add role
      </button>
    </ResumeStudioSectionCard>
  );
}
