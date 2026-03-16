import {
  Children,
  createContext,
  isValidElement,
  type ReactNode,
} from 'react';

export interface PageBodyLayout {
  hasLeftSidebar: boolean;
  hasRightSidebar: boolean;
}

export type SidebarPlacement = 'left' | 'right';

export interface PageSidebarPlacementProps {
  placement: SidebarPlacement;
}

export const PageBodyLayoutContext = createContext<PageBodyLayout>({
  hasLeftSidebar: false,
  hasRightSidebar: false,
});

export function getPageBodyLayout(
  children: ReactNode,
  sidebarComponent: unknown
): PageBodyLayout {
  let hasLeftSidebar = false;
  let hasRightSidebar = false;

  Children.forEach(children, (child) => {
    if (
      !isValidElement<PageSidebarPlacementProps>(child) ||
      child.type !== sidebarComponent
    ) {
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

export function getBodyGridClassName({
  hasLeftSidebar,
  hasRightSidebar,
}: PageBodyLayout) {
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

export function getMainContentColumnClassName({
  hasLeftSidebar,
  hasRightSidebar,
}: PageBodyLayout) {
  if (hasLeftSidebar) {
    return 'col-start-2 col-end-3';
  }

  if (hasRightSidebar) {
    return 'col-start-1 col-end-2';
  }

  return 'col-start-1 col-end-2';
}

export function getSidebarColumnClassName(
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
