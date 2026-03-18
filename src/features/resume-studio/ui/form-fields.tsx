import { Field } from '@base-ui/react/field';
import { Input } from '@base-ui/react/input';
import type { ReactNode } from 'react';
import { Controller, useFormContext, type Path } from 'react-hook-form';

import { joinClassNames } from '../../../helpers/classNames';
import type { ResumeStudioDraft } from '../types';

interface ResumeStudioInputFieldProps {
  description?: string;
  hideLabel?: boolean;
  label: string;
  name: Path<ResumeStudioDraft>;
  placeholder?: string;
  readOnly?: boolean;
  testId?: string;
  type?: 'email' | 'text' | 'url';
}

interface ResumeStudioFieldFrameProps {
  children: ReactNode;
  containerClassName?: string;
  description?: string;
  descriptionId?: string;
  errorMessage?: string;
  errorMessageId?: string;
  hideLabel?: boolean;
  invalid?: boolean;
  label: string;
  labelId?: string;
  labelMode?: 'field' | 'plain';
  name: Path<ResumeStudioDraft>;
  rootClassName?: string;
}

export function ResumeStudioFieldFrame({
  children,
  containerClassName,
  description,
  descriptionId,
  errorMessage,
  errorMessageId,
  hideLabel = false,
  invalid = false,
  label,
  labelId,
  labelMode = 'field',
  name,
  rootClassName,
}: ResumeStudioFieldFrameProps) {
  if (labelMode === 'plain') {
    return (
      <div className={rootClassName}>
        <div className={joinClassNames('flex flex-col gap-1.5', containerClassName)}>
          <p
            id={labelId}
            className={
              hideLabel ? 'sr-only' : 'text-sm font-medium text-(--color-primary)'
            }
          >
            {label}
          </p>
          {children}
          {description ? (
            <p
              id={descriptionId}
              className="text-xs leading-5 text-(--color-secondary)"
            >
              {description}
            </p>
          ) : null}
          {errorMessage ? (
            <p id={errorMessageId} className="text-xs font-medium text-[#9b2c2c]">
              {errorMessage}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <Field.Root className={rootClassName} invalid={invalid} name={name}>
      <div className={joinClassNames('flex flex-col gap-1.5', containerClassName)}>
        <Field.Label
          className={
            hideLabel ? 'sr-only' : 'text-sm font-medium text-(--color-primary)'
          }
        >
          {label}
        </Field.Label>
        {children}
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

export function ResumeStudioInputField({
  description,
  hideLabel = false,
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
    <ResumeStudioFieldFrame
      description={description}
      errorMessage={errorMessage}
      hideLabel={hideLabel}
      invalid={Boolean(errorMessage)}
      label={label}
      name={name}
    >
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
    </ResumeStudioFieldFrame>
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
    <section>
      <h3 className="sr-only">{title}</h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
