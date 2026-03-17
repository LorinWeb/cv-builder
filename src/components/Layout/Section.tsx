import type { ComponentPropsWithoutRef, JSX } from 'react';

import { joinClassNames } from '../../helpers/classNames';

type SectionRootProps = ComponentPropsWithoutRef<'section'>;
type SectionTitleProps = ComponentPropsWithoutRef<'h2'>;
type SectionBodyProps = ComponentPropsWithoutRef<'div'>;

function SectionRoot({ className, ...props }: SectionRootProps) {
  return (
    <section
      data-testid="section"
      className={joinClassNames('text-[0.86em]', className)}
      {...props}
    />
  );
}

function SectionTitle({ className, ...props }: SectionTitleProps) {
  return (
    <h2
      data-testid="section-title"
      className={joinClassNames(
        'mt-6 flex items-center justify-between font-[sans-serif] font-medium text-(--color-secondary)',
        className
      )}
      {...props}
    />
  );
}

function SectionBody({ className, ...props }: SectionBodyProps) {
  return (
    <div
      data-testid="section-body"
      className={className}
      {...props}
    />
  );
}

type SectionComponent = ((props: SectionRootProps) => JSX.Element) & {
  Title: typeof SectionTitle;
  Body: typeof SectionBody;
};

const Section = Object.assign(SectionRoot, {
  Title: SectionTitle,
  Body: SectionBody,
}) as SectionComponent;

export default Section;
