import {
  forwardRef,
  useCallback,
  useState,
  type ComponentPropsWithoutRef,
} from 'react';
import { createPortal } from 'react-dom';

import { joinClassNames } from '../../../helpers/classNames';
import { PageHeaderStateContext } from './pageHeaderState';
import { assignRef, type StickyProp } from './stickyConfig';
import { useStickyPortalHeader } from './useStickyPortalHeader';

export type PageHeaderProps = ComponentPropsWithoutRef<'header'> & {
  sticky?: StickyProp;
};

export const PageHeader = forwardRef<HTMLElement, PageHeaderProps>(function PageHeader(
  { children, className, sticky, style, ...props },
  ref
) {
  const [anchorElement, setAnchorElement] = useState<HTMLDivElement | null>(null);
  const [headerElement, setHeaderElement] = useState<HTMLElement | null>(null);
  const {
    hasSticky,
    placeholderHeight,
    portalRootStyle,
    portalVisible,
    stickyPosition,
  } = useStickyPortalHeader({
    anchorElement,
    headerElement,
    sticky,
  });
  const handleAnchorRef = useCallback((element: HTMLDivElement | null) => {
    setAnchorElement((currentElement) =>
      currentElement === element ? currentElement : element
    );
  }, []);
  const handleSourceHeaderRef = useCallback(
    (element: HTMLElement | null) => {
      setHeaderElement((currentElement) =>
        currentElement === element ? currentElement : element
      );
      assignRef(ref, element);
    },
    [ref]
  );

  const renderHeader = (isPortalClone: boolean) => (
    <header
      ref={isPortalClone ? undefined : handleSourceHeaderRef}
      data-testid="page-header"
      data-sticky-position={hasSticky ? stickyPosition : undefined}
      data-stuck={isPortalClone ? 'true' : undefined}
      aria-hidden={isPortalClone ? undefined : portalVisible || undefined}
      className={joinClassNames(
        hasSticky && isPortalClone && 'relative isolate bg-white z-30',
        className
      )}
      style={style}
      {...props}
    >
      <PageHeaderStateContext.Provider value={{ isStickyClone: isPortalClone }}>
        {children}
      </PageHeaderStateContext.Provider>
    </header>
  );

  if (!hasSticky) {
    return renderHeader(false);
  }

  return (
    <>
      <div ref={handleAnchorRef}>
        {portalVisible ? (
          <div
            aria-hidden="true"
            data-testid="page-header-placeholder"
            style={{ height: `${placeholderHeight}px` }}
          />
        ) : (
          renderHeader(false)
        )}
      </div>

      {portalVisible
        ? createPortal(
            <div
              className="PageHeaderPortalRoot fixed left-0 right-0 z-40 hidden-for-media-print pointer-events-none"
              data-sticky-position={stickyPosition}
              style={portalRootStyle}
            >
              <div className="pointer-events-auto mx-auto box-border w-[210mm] max-w-[calc(100%-32px)] px-[10mm] max-[640px]:w-full max-[640px]:max-w-none">
                {renderHeader(true)}
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
});
