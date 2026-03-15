import {
  Children,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  type ComponentPropsWithoutRef,
  type JSX,
  type ReactNode,
} from 'react';

import { joinClassNames } from '../../helpers/print';
import { assignRef, useStickyState, type StickyProp } from './sticky';

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

const PageHeader = forwardRef<HTMLElement, PageHeaderProps>(function PageHeader(
  { className, sticky, style, ...props },
  ref
) {
  const { normalizedSticky, ref: stickyRef, stickyStyle } = useStickyState(sticky);

  return (
    <header
      ref={(element) => {
        stickyRef(element);
        assignRef(ref, element);
      }}
      data-testid="page-header"
      data-sticky-position={normalizedSticky?.position}
      className={joinClassNames(normalizedSticky && 'bg-white z-30', className)}
      style={stickyStyle ? { ...style, ...stickyStyle } : style}
      {...props}
    />
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
