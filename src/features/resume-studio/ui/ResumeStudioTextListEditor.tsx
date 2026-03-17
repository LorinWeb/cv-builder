import { useFieldArray, useFormContext, type FieldArrayPath, type Path } from 'react-hook-form';

import { ResumeStudioInputField, ResumeStudioSectionCard } from './form-fields';
import type { ResumeStudioDraft } from '../types';

interface ResumeStudioTextListEditorProps {
  addLabel: string;
  emptyCopy: string;
  label: string;
  name: FieldArrayPath<ResumeStudioDraft>;
  placeholder: string;
}

export function ResumeStudioTextListEditor({
  addLabel,
  emptyCopy,
  label,
  name,
  placeholder,
}: ResumeStudioTextListEditorProps) {
  const { control } = useFormContext<ResumeStudioDraft>();
  const { append, fields, remove } = useFieldArray({
    control,
    name,
  });

  return (
    <ResumeStudioSectionCard title={label}>
      {fields.length === 0 ? (
        <p className="m-0 text-sm leading-6 text-(--color-secondary)">{emptyCopy}</p>
      ) : null}

      <div className="space-y-3">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="rounded-2xl border border-[rgba(74,127,122,0.14)] bg-[rgba(242,246,241,0.76)] p-3.5"
          >
            <ResumeStudioInputField
              label={`${label} ${index + 1}`}
              name={`${name}.${index}.text` as Path<ResumeStudioDraft>}
              placeholder={placeholder}
            />
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => remove(index)}
                className="rounded-full border border-[rgba(155,44,44,0.2)] px-3 py-1.5 text-xs font-medium text-[#9b2c2c]"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => append({ text: '' } as never)}
        className="rounded-full border border-(--color-header-border) bg-white px-4 py-2 text-sm font-medium text-(--color-primary)"
      >
        {addLabel}
      </button>
    </ResumeStudioSectionCard>
  );
}
