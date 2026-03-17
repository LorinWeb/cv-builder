import { useFieldArray, useFormContext, type FieldArrayPath, type Path } from 'react-hook-form';

import type { ResumeStudioDraft } from '../types';
import { TextEditor } from './TextEditor';

function TrashIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M6.5 1.75h3A1.75 1.75 0 0 1 11.25 3H14a.75.75 0 0 1 0 1.5h-.72l-.63 8.2A2 2 0 0 1 10.66 14.5H5.34a2 2 0 0 1-1.99-1.8l-.63-8.2H2a.75.75 0 0 1 0-1.5h2.75A1.75 1.75 0 0 1 6.5 1.75Zm3.25 1.25A.25.25 0 0 0 9.5 2.75h-3a.25.25 0 0 0-.25.25V3h3.5ZM4.22 4.5l.63 8.08a.5.5 0 0 0 .49.42h5.32a.5.5 0 0 0 .49-.42l.63-8.08H4.22Zm2.03 1.25c.41 0 .75.34.75.75v4a.75.75 0 0 1-1.5 0v-4c0-.41.34-.75.75-.75Zm3.5 0c.41 0 .75.34.75.75v4a.75.75 0 0 1-1.5 0v-4c0-.41.34-.75.75-.75Z" />
    </svg>
  );
}

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
            <button
              type="button"
              aria-label={`Remove ${itemLabel} ${index + 1}`}
              onClick={() => remove(index)}
              className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[rgba(155,44,44,0.2)] bg-[rgba(155,44,44,0.06)] text-[#9b2c2c] transition hover:bg-[rgba(155,44,44,0.12)]"
            >
              <TrashIcon />
            </button>
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
    </div>
  );
}
