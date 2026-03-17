import { Field } from '@base-ui/react/field';
import { Input } from '@base-ui/react/input';
import { Controller, useFormContext, type Path } from 'react-hook-form';

import { joinClassNames } from '../../../helpers/classNames';
import type { ResumeStudioDraft } from '../types';

interface ResumeStudioInputFieldProps {
  description?: string;
  label: string;
  name: Path<ResumeStudioDraft>;
  placeholder?: string;
  readOnly?: boolean;
  testId?: string;
  type?: 'email' | 'text' | 'url';
}

export function ResumeStudioInputField({
  description,
  label,
  name,
  placeholder,
  readOnly = false,
  testId,
  type = 'text',
}: ResumeStudioInputFieldProps) {
  const { control, formState, getFieldState } = useFormContext<ResumeStudioDraft>();
  const fieldState = getFieldState(name, formState);
  const errorMessage = fieldState.error?.message;

  return (
    <Field.Root invalid={Boolean(errorMessage)} name={name}>
      <div className="flex flex-col gap-1.5">
        <Field.Label className="text-sm font-medium text-(--color-primary)">
          {label}
        </Field.Label>
        <Controller
          control={control}
          name={name}
          render={({ field }) => (
            <Input
              data-testid={testId}
              readOnly={readOnly}
              type={type}
              value={typeof field.value === 'string' ? field.value : ''}
              onBlur={field.onBlur}
              onValueChange={field.onChange}
              placeholder={placeholder}
              className={joinClassNames(
                'w-full rounded-2xl border px-3.5 py-2.5 text-sm text-[#17312a] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] outline-none transition focus:border-(--color-primary) focus:ring-2 focus:ring-[rgba(1,135,65,0.15)]',
                readOnly
                  ? 'border-[rgba(74,127,122,0.2)] bg-[rgba(74,127,122,0.08)]'
                  : 'border-[rgba(74,127,122,0.25)] bg-white'
              )}
            />
          )}
        />
        {description ? (
          <Field.Description className="text-xs leading-5 text-(--color-secondary)">
            {description}
          </Field.Description>
        ) : null}
        {errorMessage ? (
          <p className="text-xs font-medium text-[#9b2c2c]">{errorMessage}</p>
        ) : null}
      </div>
    </Field.Root>
  );
}

interface ResumeStudioTextAreaFieldProps {
  description?: string;
  label: string;
  name: Path<ResumeStudioDraft>;
  placeholder?: string;
  rows?: number;
  testId?: string;
}

export function ResumeStudioTextAreaField({
  description,
  label,
  name,
  placeholder,
  rows = 4,
  testId,
}: ResumeStudioTextAreaFieldProps) {
  const { formState, getFieldState, register } = useFormContext<ResumeStudioDraft>();
  const fieldState = getFieldState(name, formState);
  const errorMessage = fieldState.error?.message;

  return (
    <Field.Root invalid={Boolean(errorMessage)} name={name}>
      <div className="flex flex-col gap-1.5">
        <Field.Label className="text-sm font-medium text-(--color-primary)">
          {label}
        </Field.Label>
        <textarea
          {...register(name)}
          data-testid={testId}
          rows={rows}
          placeholder={placeholder}
          className="max-w-full resize-y rounded-2xl border border-[rgba(74,127,122,0.25)] bg-white px-3.5 py-2.5 text-sm text-[#17312a] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] outline-none transition focus:border-(--color-primary) focus:ring-2 focus:ring-[rgba(1,135,65,0.15)] w-full max-h-64 overflow-y-auto"
        />
        {description ? (
          <Field.Description className="text-xs leading-5 text-(--color-secondary)">
            {description}
          </Field.Description>
        ) : null}
        {errorMessage ? (
          <p className="text-xs font-medium text-[#9b2c2c]">{errorMessage}</p>
        ) : null}
      </div>
    </Field.Root>
  );
}

export function ResumeStudioSectionCard({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="rounded-[28px] border border-[rgba(74,127,122,0.18)] bg-[rgba(255,255,255,0.82)] p-4.5 shadow-[0_24px_80px_-40px_rgba(18,55,46,0.45)]">
      <header className="mb-4">
        <h3 className="m-0 text-base font-medium text-(--color-primary)">{title}</h3>
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
