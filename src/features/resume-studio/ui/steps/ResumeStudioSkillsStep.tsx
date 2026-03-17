import { useFieldArray, useFormContext } from 'react-hook-form';

import { ListItemsEditor } from '../ListItemsEditor';
import { ResumeStudioInputField, ResumeStudioSectionCard } from '../form-fields';
import type { ResumeStudioDraft } from '../../types';

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

export function ResumeStudioSkillsStep() {
  const { control } = useFormContext<ResumeStudioDraft>();
  const { append, fields, remove } = useFieldArray({
    control,
    name: 'skills',
  });

  return (
    <ResumeStudioSectionCard title="Skills">
      <div className="space-y-4">
        {fields.map((field, index) => {
          return (
            <div
              key={field.id}
              className="relative rounded-3xl border border-[rgba(74,127,122,0.14)] bg-[rgba(242,246,241,0.76)] p-4"
            >
              <button
                type="button"
                aria-label={`Remove skill category ${index + 1}`}
                onClick={() => remove(index)}
                className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#c53a3a] text-white transition hover:bg-[#ab2c2c]"
              >
                <CloseIcon />
              </button>

              <div className="pr-10">
                <ResumeStudioInputField
                  hideLabel
                  label="Category"
                  name={`skills.${index}.name`}
                  placeholder="Leadership and delivery"
                />
              </div>

              <div className="mt-4">
                <ListItemsEditor
                  addLabel="Add keyword"
                  emptyCopy="List the tools, domains, or strengths you want this category to cover."
                  hideLabel
                  itemLabel="keyword"
                  label="Keywords"
                  name={`skills.${index}.keywords`}
                  placeholder="Roadmapping, mentoring, platform design, or incident response."
                />
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => append({ keywords: [], name: '' })}
        className="rounded-full border border-(--color-header-border) bg-white px-4 py-2 text-sm font-medium text-(--color-primary)"
      >
        Add skill category
      </button>
    </ResumeStudioSectionCard>
  );
}
