import { Field } from '@base-ui/react/field';
import { Input } from '@base-ui/react/input';
import type { ReactNode } from 'react';
import { Controller, useFormContext, useWatch, type Path } from 'react-hook-form';

import { joinClassNames } from '../../../helpers/classNames';
import type { ResumeStudioDraft } from '../types';

interface ResumeStudioInputFieldProps {
  className?: string;
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
              hideLabel ? 'sr-only' : 'text-sm font-medium text-(--color-text-strong)'
            }
          >
            {label}
          </p>
          {children}
          {description ? (
            <p
              id={descriptionId}
              className="text-xs leading-5 text-(--color-text-muted)"
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
            hideLabel ? 'sr-only' : 'text-sm font-medium text-(--color-text-strong)'
          }
        >
          {label}
        </Field.Label>
        {children}
        {description ? (
          <Field.Description className="text-xs leading-5 text-(--color-text-muted)">
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
  className,
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
      rootClassName={className}
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
                'w-full rounded-2xl border px-3.5 py-2.5 text-sm text-(--color-text-body) shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] outline-none transition focus:border-(--color-focus-border) focus:ring-2 focus:ring-(--color-focus-ring)',
                readOnly
                  ? 'border-(--color-border-readonly) bg-(--color-surface-subtle)'
                  : 'border-(--color-border-control) bg-(--color-surface-base)'
              )}
            />
          )}
        />
    </ResumeStudioFieldFrame>
  );
}

interface ResumeStudioCheckboxFieldProps {
  className?: string;
  description?: string;
  label: string;
  name: Path<ResumeStudioDraft>;
  testId?: string;
}

export function ResumeStudioCheckboxField({
  className,
  description,
  label,
  name,
  testId,
}: ResumeStudioCheckboxFieldProps) {
  const { control, setValue } = useFormContext<ResumeStudioDraft>();
  const isChecked = Boolean(
    useWatch({
      control,
      name,
    })
  );

  return (
    <div className={joinClassNames('flex flex-col gap-1.5', className)}>
      <button
        data-testid={testId}
        type="button"
        role="checkbox"
        aria-checked={isChecked}
        onClick={() =>
          setValue(name, !isChecked as never, {
            shouldDirty: true,
            shouldTouch: true,
          })
        }
        className="relative z-10 inline-flex items-center gap-2 text-left text-sm font-medium text-(--color-text-strong) outline-none transition focus:ring-2 focus:ring-(--color-focus-ring)"
      >
        <span
          aria-hidden="true"
          className={joinClassNames(
            'flex h-4 w-4 items-center justify-center rounded border border-(--color-border-strong) bg-(--color-surface-base)',
            isChecked && 'border-(--color-fill-strong) bg-(--color-fill-strong) text-white'
          )}
        >
          <span
            className={joinClassNames(
              'h-2 w-2 rounded-xs bg-current transition-opacity',
              isChecked ? 'opacity-100' : 'opacity-0'
            )}
          />
        </span>
        <span>{label}</span>
      </button>
      {description ? (
        <p className="text-xs leading-5 text-(--color-text-muted)">
          {description}
        </p>
      ) : null}
    </div>
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
