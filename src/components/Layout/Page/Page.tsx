import { useContext, type ComponentPropsWithoutRef, type JSX } from 'react';

import { joinClassNames } from '../../../helpers/classNames';
import { PageHeader, type PageHeaderProps } from './PageHeader';
import {
  PageBodyLayoutContext,
  getBodyGridClassName,
  getMainContentColumnClassName,
  getPageBodyLayout,
  getSidebarColumnClassName,
  type SidebarPlacement,
} from './pageBodyLayout';

type PageRootProps = ComponentPropsWithoutRef<'div'>;
type PageBodyProps = ComponentPropsWithoutRef<'div'>;
type PageMainContentProps = ComponentPropsWithoutRef<'main'>;
type PageFooterProps = ComponentPropsWithoutRef<'footer'>;
type PageSidebarProps = ComponentPropsWithoutRef<'aside'> & {
  placement: SidebarPlacement;
};

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

function PageBody({ children, className, ...props }: PageBodyProps) {
  const layout = getPageBodyLayout(children, PageSidebar);

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

export type { PageHeaderProps };
export default Page;
