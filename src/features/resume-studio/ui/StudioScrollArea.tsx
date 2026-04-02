import { ScrollArea } from '@base-ui/react/scroll-area';
import type { ComponentPropsWithoutRef, ReactNode, Ref } from 'react';

import { joinClassNames } from '../../../helpers/classNames';

interface StudioScrollAreaProps {
  children: ReactNode;
  contentClassName?: string;
  rootClassName?: string;
  rootTestId?: string;
  viewportClassName?: string;
  viewportRef?: Ref<HTMLDivElement>;
  viewportTestId?: string;
}

function StudioScrollThumb() {
  return (
    <ScrollArea.Thumb className="rounded-full bg-[rgba(24,54,51,0.16)] transition hover:bg-[rgba(24,54,51,0.24)] data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full" />
  );
}

type ScrollbarProps = Pick<ComponentPropsWithoutRef<typeof ScrollArea.Scrollbar>, 'orientation'>;

function StudioScrollbar({ orientation }: ScrollbarProps) {
  return (
    <ScrollArea.Scrollbar
      keepMounted
      orientation={orientation}
      className={(state) =>
        joinClassNames(
          'absolute z-10 flex select-none touch-none p-1 transition-opacity',
          orientation === 'vertical'
            ? 'inset-y-0 right-0 w-3 flex-col'
            : 'inset-x-0 bottom-0 h-3',
          orientation === 'vertical'
            ? !state.hasOverflowY && 'pointer-events-none opacity-0'
            : !state.hasOverflowX && 'pointer-events-none opacity-0'
        )
      }
    >
      <StudioScrollThumb />
    </ScrollArea.Scrollbar>
  );
}

export function StudioScrollArea({
  children,
  contentClassName,
  rootClassName,
  rootTestId,
  viewportClassName,
  viewportRef,
  viewportTestId,
}: StudioScrollAreaProps) {
  return (
    <ScrollArea.Root
      data-testid={rootTestId}
      className={joinClassNames('relative h-full min-h-0 w-full overflow-hidden', rootClassName)}
    >
      <ScrollArea.Viewport
        ref={viewportRef}
        data-testid={viewportTestId}
        className={joinClassNames('h-full min-h-0 w-full', viewportClassName)}
      >
        <ScrollArea.Content
          className={joinClassNames('min-h-0 w-full', contentClassName)}
        >
          {children}
        </ScrollArea.Content>
      </ScrollArea.Viewport>
      <StudioScrollbar orientation="vertical" />
      <StudioScrollbar orientation="horizontal" />
    </ScrollArea.Root>
  );
}
