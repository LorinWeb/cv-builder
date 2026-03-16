import {
  Children,
  createContext,
  forwardRef,
  isValidElement,
  useCallback,
  useContext,
  useLayoutEffect,
  useState,
  type ComponentPropsWithoutRef,
  type JSX,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

import { joinClassNames } from '../../helpers/print';
import { PageHeaderStateContext } from './pageHeaderState';
import {
  assignRef,
  normalizeStickyConfig,
  type NormalizedStickyConfig,
  type StickyProp,
} from './sticky';

type PageRootProps = ComponentPropsWithoutRef<'div'>;
type PageHeaderProps = ComponentPropsWithoutRef<'header'> & {
  sticky?: StickyProp;
};
type PageBodyProps = ComponentPropsWithoutRef<'div'>;
type PageMainContentProps = ComponentPropsWithoutRef<'main'>;
type PageFooterProps = ComponentPropsWithoutRef<'footer'>;
type SidebarPlacement = 'left' | 'right';
type PageSidebarProps = ComponentPropsWithoutRef<'aside'> & {
  placement: SidebarPlacement;
};

interface PageBodyLayout {
  hasLeftSidebar: boolean;
  hasRightSidebar: boolean;
}

const PageBodyLayoutContext = createContext<PageBodyLayout>({
  hasLeftSidebar: false,
  hasRightSidebar: false,
});

function getPageBodyLayout(children: ReactNode): PageBodyLayout {
  let hasLeftSidebar = false;
  let hasRightSidebar = false;

  Children.forEach(children, (child) => {
    if (!isValidElement<PageSidebarProps>(child) || child.type !== PageSidebar) {
      return;
    }

    if (child.props.placement === 'left') {
      hasLeftSidebar = true;
    }

    if (child.props.placement === 'right') {
      hasRightSidebar = true;
    }
  });

  return {
    hasLeftSidebar,
    hasRightSidebar,
  };
}

function getBodyGridClassName({ hasLeftSidebar, hasRightSidebar }: PageBodyLayout) {
  if (hasLeftSidebar && hasRightSidebar) {
    return 'grid-cols-[minmax(0,1fr)_minmax(0,2.15fr)_minmax(0,1fr)]';
  }

  if (hasLeftSidebar) {
    return 'grid-cols-[minmax(0,1fr)_minmax(0,2.15fr)]';
  }

  if (hasRightSidebar) {
    return 'grid-cols-[minmax(0,2.15fr)_minmax(0,1fr)]';
  }

  return 'grid-cols-[minmax(0,1fr)]';
}

function getMainContentColumnClassName({ hasLeftSidebar, hasRightSidebar }: PageBodyLayout) {
  if (hasLeftSidebar) {
    return 'col-start-2 col-end-3';
  }

  if (hasRightSidebar) {
    return 'col-start-1 col-end-2';
  }

  return 'col-start-1 col-end-2';
}

function getSidebarColumnClassName(
  { hasLeftSidebar }: PageBodyLayout,
  placement: SidebarPlacement
) {
  if (placement === 'left') {
    return 'col-start-1 col-end-2';
  }

  if (hasLeftSidebar) {
    return 'col-start-3 col-end-4';
  }

  return 'col-start-2 col-end-3';
}

function PageRoot({ className, ...props }: PageRootProps) {
  return (
    <div
      data-testid="page"
      className={joinClassNames(
        'PageRoot relative z-10 mx-auto my-12.5 box-border h-auto min-h-[297mm] w-[210mm] max-w-[calc(100%-32px)] bg-white px-[10mm] py-[15mm] shadow-[1px_3px_8px_-1px_rgba(0,0,0,0.2)] print:m-0 print:h-auto print:min-h-0 print:w-auto print:max-w-none print:bg-transparent print:p-0 print:shadow-none',
        className
      )}
      {...props}
    />
  );
}

function getResolvedPortalOffset(
  offset: string,
  position: NormalizedStickyConfig['position']
) {
  const probeElement = document.createElement('div');

  probeElement.style.position = 'fixed';
  probeElement.style.pointerEvents = 'none';
  probeElement.style.visibility = 'hidden';
  probeElement.style[position] = offset;
  probeElement.style[position === 'bottom' ? 'top' : 'bottom'] = 'auto';
  document.body.appendChild(probeElement);

  const computedStyle = window.getComputedStyle(probeElement);
  const resolvedOffset =
    parseFloat(computedStyle[position === 'bottom' ? 'bottom' : 'top']) || 0;

  document.body.removeChild(probeElement);

  return resolvedOffset;
}

function getPortalVisibility(
  anchorElement: HTMLElement,
  sticky: NormalizedStickyConfig,
  resolvedOffset: number,
  wasVisible: boolean
) {
  const rect = anchorElement.getBoundingClientRect();

  if (sticky.position === 'bottom') {
    const stickyEdge = window.innerHeight - resolvedOffset;

    if (wasVisible) {
      return rect.bottom >= stickyEdge;
    }

    return rect.top >= stickyEdge;
  }

  if (wasVisible) {
    return rect.top <= resolvedOffset;
  }

  return rect.bottom <= resolvedOffset;
}

const PageHeader = forwardRef<HTMLElement, PageHeaderProps>(function PageHeader(
  { children, className, sticky, style, ...props },
  ref
) {
  const [anchorElement, setAnchorElement] = useState<HTMLDivElement | null>(null);
  const [headerElement, setHeaderElement] = useState<HTMLElement | null>(null);
  const [portalVisible, setPortalVisible] = useState(false);
  const [portalOffset, setPortalOffset] = useState(0);
  const [placeholderHeight, setPlaceholderHeight] = useState(0);
  const normalizedSticky = normalizeStickyConfig(sticky);
  const hasSticky = !!normalizedSticky;
  const stickyOffset = normalizedSticky?.offset ?? '0px';
  const stickyPosition = normalizedSticky?.position ?? 'top';
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

  useLayoutEffect(() => {
    if (!hasSticky || !headerElement) {
      setPlaceholderHeight(0);
      return;
    }

    const updateHeight = () => {
      const nextHeight = headerElement.getBoundingClientRect().height;

      setPlaceholderHeight((currentHeight) =>
        currentHeight === nextHeight ? currentHeight : nextHeight
      );
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });

    resizeObserver.observe(headerElement);
    window.addEventListener('resize', updateHeight, { passive: true });

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, [hasSticky, headerElement]);

  useLayoutEffect(() => {
    if (!hasSticky) {
      setPortalOffset(0);
      return;
    }

    const updateOffset = () => {
      const nextOffset = getResolvedPortalOffset(stickyOffset, stickyPosition);

      setPortalOffset((currentOffset) =>
        currentOffset === nextOffset ? currentOffset : nextOffset
      );
    };

    updateOffset();
    window.addEventListener('resize', updateOffset, { passive: true });
    window.visualViewport?.addEventListener('resize', updateOffset, { passive: true });

    return () => {
      window.removeEventListener('resize', updateOffset);
      window.visualViewport?.removeEventListener('resize', updateOffset);
    };
  }, [hasSticky, stickyOffset, stickyPosition]);

  useLayoutEffect(() => {
    if (!hasSticky || !anchorElement) {
      setPortalVisible(false);
      return;
    }

    const updatePortalVisibility = () => {
      setPortalVisible((currentVisibility) => {
        const nextVisibility = getPortalVisibility(
          anchorElement,
          {
            offset: stickyOffset,
            position: stickyPosition,
          },
          portalOffset,
          currentVisibility
        );

        return currentVisibility === nextVisibility ? currentVisibility : nextVisibility;
      });
    };

    let animationFrameId = 0;

    const queuePortalVisibilityUpdate = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = requestAnimationFrame(() => {
        animationFrameId = 0;
        updatePortalVisibility();
      });
    };

    updatePortalVisibility();

    const resizeObserver = new ResizeObserver(() => {
      queuePortalVisibilityUpdate();
    });

    resizeObserver.observe(anchorElement);
    window.addEventListener('resize', queuePortalVisibilityUpdate, { passive: true });
    window.addEventListener('scroll', queuePortalVisibilityUpdate, { passive: true });
    window.visualViewport?.addEventListener('resize', queuePortalVisibilityUpdate, {
      passive: true,
    });
    window.visualViewport?.addEventListener('scroll', queuePortalVisibilityUpdate, {
      passive: true,
    });

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      resizeObserver.disconnect();
      window.removeEventListener('resize', queuePortalVisibilityUpdate);
      window.removeEventListener('scroll', queuePortalVisibilityUpdate);
      window.visualViewport?.removeEventListener('resize', queuePortalVisibilityUpdate);
      window.visualViewport?.removeEventListener('scroll', queuePortalVisibilityUpdate);
    };
  }, [anchorElement, hasSticky, portalOffset, stickyOffset, stickyPosition]);

  const portalRootStyle =
    stickyPosition === 'bottom'
      ? { bottom: stickyOffset, top: 'auto' }
      : { bottom: 'auto', top: stickyOffset };

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
              className={joinClassNames(
                'PageHeaderPortalRoot fixed left-0 right-0 z-40 hidden-for-media-print pointer-events-none'
              )}
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

function PageBody({ children, className, ...props }: PageBodyProps) {
  const layout = getPageBodyLayout(children);

  return (
    <PageBodyLayoutContext.Provider value={layout}>
      <div
        data-testid="page-body"
        className={joinClassNames(
          'box-border grid h-auto min-h-[267mm] w-full items-start gap-7 max-[640px]:grid-cols-1 max-[640px]:gap-6',
          getBodyGridClassName(layout),
          className
        )}
        {...props}
      >
        {children}
      </div>
    </PageBodyLayoutContext.Provider>
  );
}

function PageMainContent({ className, ...props }: PageMainContentProps) {
  const layout = useContext(PageBodyLayoutContext);

  return (
    <main
      data-testid="page-main-content"
      className={joinClassNames(
        'min-w-0 box-border w-full max-[640px]:col-auto max-[640px]:border-0 max-[640px]:px-0',
        getMainContentColumnClassName(layout),
        layout.hasLeftSidebar && 'border-l border-l-(--color-main-border) pl-5',
        layout.hasRightSidebar && 'border-r border-r-(--color-main-border) pr-5',
        className
      )}
      {...props}
    />
  );
}

function PageSidebar({ placement, className, ...props }: PageSidebarProps) {
  const layout = useContext(PageBodyLayoutContext);

  return (
    <aside
      data-testid={`page-sidebar-${placement}`}
      data-placement={placement}
      className={joinClassNames(
        'min-w-0 box-border w-full space-y-7 max-[640px]:col-auto max-[640px]:px-0',
        getSidebarColumnClassName(layout, placement),
        placement === 'left' && 'pr-1.5',
        placement === 'right' && 'pl-1.5',
        className
      )}
      {...props}
    />
  );
}

function PageFooter({ className, ...props }: PageFooterProps) {
  return <footer data-testid="page-footer" className={className} {...props} />;
}

type PageComponent = ((props: PageRootProps) => JSX.Element) & {
  Header: typeof PageHeader;
  Body: typeof PageBody;
  MainContent: typeof PageMainContent;
  Sidebar: typeof PageSidebar;
  Footer: typeof PageFooter;
};

const Page = Object.assign(PageRoot, {
  Header: PageHeader,
  Body: PageBody,
  MainContent: PageMainContent,
  Sidebar: PageSidebar,
  Footer: PageFooter,
}) as PageComponent;

export default Page;
