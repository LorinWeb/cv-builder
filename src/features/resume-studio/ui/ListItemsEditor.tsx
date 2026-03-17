import { Trash2 } from 'lucide-react';
import { useFieldArray, useFormContext, type FieldArrayPath, type Path } from 'react-hook-form';

import { createEmptyResumeStudioTextDraft } from '../draft-factories';
import type { ResumeStudioDraft } from '../types';
import { TextEditor } from './TextEditor';
import { ResumeStudioButton } from './primitives';

interface ListItemsEditorProps {
  addLabel: string;
  emptyCopy: string;
  hideLabel?: boolean;
  itemLabel?: string;
  label: string;
  name: FieldArrayPath<ResumeStudioDraft>;
  placeholder: string;
}

export function ListItemsEditor({
  addLabel,
  emptyCopy,
  hideLabel = false,
  itemLabel = 'item',
  label,
  name,
  placeholder,
}: ListItemsEditorProps) {
  const { control } = useFormContext<ResumeStudioDraft>();
  const { append, fields, remove } = useFieldArray({
    control,
    name,
  });

  return (
    <div className="space-y-3">
      {hideLabel ? null : (
        <h4 className="sr-only">{label}</h4>
      )}

      {fields.length === 0 ? (
        <p className="m-0 text-sm leading-6 text-(--color-secondary)">{emptyCopy}</p>
      ) : null}

      <div className="space-y-2.5">
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-start gap-2">
            <TextEditor
              hideLabel
              label={`${label} ${index + 1}`}
              minRows={1}
              mode="inline"
              name={`${name}.${index}.text` as Path<ResumeStudioDraft>}
              placeholder={placeholder}
              rootClassName="min-w-0 flex-1"
            />
            <ResumeStudioButton
              aria-label={`Remove ${itemLabel} ${index + 1}`}
              onClick={() => remove(index)}
              size="iconLarge"
              variant="dangerOutline"
              className="mt-1"
            >
              <Trash2 className="h-4 w-4" />
            </ResumeStudioButton>
          </div>
        ))}
      </div>

      <ResumeStudioButton onClick={() => append(createEmptyResumeStudioTextDraft() as never)}>
        {addLabel}
      </ResumeStudioButton>
    </div>
  );
}
