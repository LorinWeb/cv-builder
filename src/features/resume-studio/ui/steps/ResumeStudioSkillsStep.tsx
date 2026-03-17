import { Field } from '@base-ui/react/field';
import { Input } from '@base-ui/react/input';
import {
  Controller,
  useFieldArray,
  useFormContext,
  type Path,
} from 'react-hook-form';

import { joinClassNames } from '../../../../helpers/classNames';
import { ResumeStudioSectionCard } from '../form-fields';
import type { ResumeStudioDraft } from '../../types';

function TrashIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M6.5 1.75h3A1.75 1.75 0 0 1 11.25 3H14a.75.75 0 0 1 0 1.5h-.72l-.63 8.2A2 2 0 0 1 10.66 14.5H5.34a2 2 0 0 1-1.99-1.8l-.63-8.2H2a.75.75 0 0 1 0-1.5h2.75A1.75 1.75 0 0 1 6.5 1.75Zm3.25 1.25A.25.25 0 0 0 9.5 2.75h-3a.25.25 0 0 0-.25.25V3h3.5ZM4.22 4.5l.63 8.08a.5.5 0 0 0 .49.42h5.32a.5.5 0 0 0 .49-.42l.63-8.08H4.22Zm2.03 1.25c.41 0 .75.34.75.75v4a.75.75 0 0 1-1.5 0v-4c0-.41.34-.75.75-.75Zm3.5 0c.41 0 .75.34.75.75v4a.75.75 0 0 1-1.5 0v-4c0-.41.34-.75.75-.75Z" />
    </svg>
  );
}

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

function ResumeStudioSkillKeywords({
  skillIndex,
}: {
  skillIndex: number;
}) {
  const { control, formState, getFieldState } = useFormContext<ResumeStudioDraft>();
  const name = `skills.${skillIndex}.keywords` as const;
  const { append, fields, remove } = useFieldArray({
    control,
    name,
  });

  return (
    <div className="space-y-3">
      {fields.length === 0 ? (
        <p className="m-0 text-sm leading-6 text-(--color-secondary)">
          List the tools, domains, or strengths you want this category to cover.
        </p>
      ) : null}

      <div className="space-y-2.5">
        {fields.map((field, keywordIndex) => {
          const fieldName =
            `skills.${skillIndex}.keywords.${keywordIndex}.text` as Path<ResumeStudioDraft>;
          const fieldState = getFieldState(fieldName, formState);
          const errorMessage = fieldState.error?.message;

          return (
            <Field.Root
              key={field.id}
              invalid={Boolean(errorMessage)}
              name={fieldName}
            >
              <div className="flex items-start gap-2">
                <Field.Label className="sr-only">
                  Keyword {keywordIndex + 1}
                </Field.Label>
                <Controller
                  control={control}
                  name={fieldName}
                  render={({ field: keywordField }) => (
                    <Input
                      value={
                        typeof keywordField.value === 'string' ? keywordField.value : ''
                      }
                      onBlur={keywordField.onBlur}
                      onValueChange={keywordField.onChange}
                      placeholder="Roadmapping, mentoring, platform design, or incident response."
                      className={joinClassNames(
                        'min-w-0 flex-1 rounded-2xl border px-3.5 py-2.5 text-sm text-[#17312a] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] outline-none transition focus:border-(--color-primary) focus:ring-2 focus:ring-[rgba(1,135,65,0.15)]',
                        errorMessage
                          ? 'border-[rgba(155,44,44,0.35)] bg-white'
                          : 'border-[rgba(74,127,122,0.25)] bg-white'
                      )}
                    />
                  )}
                />
                <button
                  type="button"
                  aria-label={`Remove keyword ${keywordIndex + 1}`}
                  onClick={() => remove(keywordIndex)}
                  className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[rgba(155,44,44,0.2)] bg-[rgba(155,44,44,0.06)] text-[#9b2c2c] transition hover:bg-[rgba(155,44,44,0.12)]"
                >
                  <TrashIcon />
                </button>
              </div>
              {errorMessage ? (
                <p className="mt-1 text-xs font-medium text-[#9b2c2c]">{errorMessage}</p>
              ) : null}
            </Field.Root>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => append({ text: '' })}
        className="rounded-full border border-(--color-header-border) bg-white px-4 py-2 text-sm font-medium text-(--color-primary)"
      >
        Add keyword
      </button>
    </div>
  );
}

export function ResumeStudioSkillsStep() {
  const { control, formState, getFieldState } = useFormContext<ResumeStudioDraft>();
  const { append, fields, remove } = useFieldArray({
    control,
    name: 'skills',
  });

  return (
    <ResumeStudioSectionCard title="Skills">
      <div className="space-y-4">
        {fields.map((field, index) => {
          const fieldName = `skills.${index}.name` as Path<ResumeStudioDraft>;
          const fieldState = getFieldState(fieldName, formState);
          const errorMessage = fieldState.error?.message;

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

              <Field.Root invalid={Boolean(errorMessage)} name={fieldName}>
                <div className="pr-10">
                  <Field.Label className="sr-only">Category</Field.Label>
                  <Controller
                    control={control}
                    name={fieldName}
                    render={({ field: categoryField }) => (
                      <Input
                        value={
                          typeof categoryField.value === 'string'
                            ? categoryField.value
                            : ''
                        }
                        onBlur={categoryField.onBlur}
                        onValueChange={categoryField.onChange}
                        placeholder="Leadership and delivery"
                        className={joinClassNames(
                          'w-full rounded-2xl border px-3.5 py-2.5 text-sm text-[#17312a] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] outline-none transition focus:border-(--color-primary) focus:ring-2 focus:ring-[rgba(1,135,65,0.15)]',
                          errorMessage
                            ? 'border-[rgba(155,44,44,0.35)] bg-white'
                            : 'border-[rgba(74,127,122,0.25)] bg-white'
                        )}
                      />
                    )}
                  />
                  {errorMessage ? (
                    <p className="mt-1 text-xs font-medium text-[#9b2c2c]">
                      {errorMessage}
                    </p>
                  ) : null}
                </div>
              </Field.Root>

              <div className="mt-4">
                <ResumeStudioSkillKeywords skillIndex={index} />
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
