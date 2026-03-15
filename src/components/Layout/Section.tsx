import type { ComponentPropsWithoutRef, JSX } from 'react';

import { joinClassNames } from '../../helpers/print';
import { useStickyState, type StickyProp } from './sticky';

type SectionRootProps = ComponentPropsWithoutRef<'section'>;
type SectionTitleProps = ComponentPropsWithoutRef<'h2'> & {
  sticky?: StickyProp;
};
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

function SectionTitle({ className, sticky, style, ...props }: SectionTitleProps) {
  const { normalizedSticky, ref, stickyStyle } = useStickyState(sticky);

  return (
    <h2
      ref={ref}
      data-testid="section-title"
      data-sticky-position={normalizedSticky?.position}
      className={joinClassNames(
        'mt-2.5 flex items-center justify-between font-[sans-serif] font-medium leading-[1.6em] text-(--color-secondary)',
        normalizedSticky && 'bg-white z-20',
        className
      )}
      style={stickyStyle ? { ...style, ...stickyStyle } : style}
      {...props}
    />
  );
}

function SectionBody({ className, ...props }: SectionBodyProps) {
  return (
    <div
      data-testid="section-body"
      className={joinClassNames('leading-[1.45]', className)}
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
