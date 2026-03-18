import type {
  ButtonHTMLAttributes,
  ElementType,
  HTMLAttributes,
  MouseEvent,
  ReactNode,
} from 'react';
import { forwardRef } from 'react';

import { joinClassNames } from '../../../helpers/classNames';

const RESUME_STUDIO_BUTTON_BASE_CLASS_NAME =
  'rounded-full font-medium transition disabled:cursor-not-allowed disabled:opacity-50';

const RESUME_STUDIO_BUTTON_VARIANTS = {
  dangerOutline:
    'border border-[rgba(155,44,44,0.2)] text-[#9b2c2c]',
  dangerSolid:
    'bg-[#c53a3a] text-white hover:bg-[#ab2c2c]',
  dangerTint:
    'border border-[rgba(155,44,44,0.24)] bg-[rgba(155,44,44,0.08)] text-[#9b2c2c]',
  primary: 'bg-(--color-fill-strong) text-white',
  secondary:
    'border border-(--color-header-border) bg-(--color-surface-base) text-(--color-text-strong)',
} as const;

const RESUME_STUDIO_BUTTON_SIZES = {
  compact: 'px-3 py-1.5 text-xs',
  default: 'px-4 py-2 text-sm',
  icon: 'inline-flex h-8 w-8 items-center justify-center',
  iconLarge:
    'inline-flex h-10 w-10 shrink-0 items-center justify-center bg-[rgba(155,44,44,0.06)] text-[#9b2c2c] hover:bg-[rgba(155,44,44,0.12)]',
  wide: 'px-5 py-2.5 text-sm',
} as const;

const RESUME_STUDIO_CARD_TONES = {
  nested: 'border-(--color-border-emphasis) bg-white/85',
  muted: 'border-(--color-border-subtle) bg-(--color-surface-subtle)',
} as const;

const RESUME_STUDIO_CARD_SPACING = {
  compact: 'rounded-2xl p-3.5',
  roomy: 'rounded-3xl p-4',
} as const;

interface ResumeStudioButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: keyof typeof RESUME_STUDIO_BUTTON_SIZES;
  variant?: keyof typeof RESUME_STUDIO_BUTTON_VARIANTS;
}

export const ResumeStudioButton = forwardRef<
  HTMLButtonElement,
  ResumeStudioButtonProps
>(function ResumeStudioButton(
  {
    children,
    className,
    onMouseDown,
    size = 'default',
    type = 'button',
    variant = 'secondary',
    ...props
  },
  ref
) {
  function handleMouseDown(event: MouseEvent<HTMLButtonElement>) {
    onMouseDown?.(event);

    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      props.disabled
    ) {
      return;
    }

    event.preventDefault();
  }

  return (
    <button
      {...props}
      ref={ref}
      onMouseDown={handleMouseDown}
      type={type}
      className={joinClassNames(
        RESUME_STUDIO_BUTTON_BASE_CLASS_NAME,
        RESUME_STUDIO_BUTTON_VARIANTS[variant],
        RESUME_STUDIO_BUTTON_SIZES[size],
        className
      )}
    >
      {children}
    </button>
  );
});

interface ResumeStudioCardProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  children: ReactNode;
  spacing?: keyof typeof RESUME_STUDIO_CARD_SPACING;
  tone?: keyof typeof RESUME_STUDIO_CARD_TONES;
}

export function ResumeStudioCard({
  as: Component = 'div',
  children,
  className,
  spacing = 'roomy',
  tone = 'muted',
  ...props
}: ResumeStudioCardProps) {
  return (
    <Component
      {...props}
      className={joinClassNames(
        'border',
        RESUME_STUDIO_CARD_TONES[tone],
        RESUME_STUDIO_CARD_SPACING[spacing],
        className
      )}
    >
      {children}
    </Component>
  );
}
