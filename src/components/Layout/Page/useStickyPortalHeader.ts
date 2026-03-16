import {
  useLayoutEffect,
  useMemo,
  useState,
  type CSSProperties,
} from 'react';

import { normalizeStickyConfig, type StickyProp } from './stickyConfig';
import { getPortalVisibility, getResolvedPortalOffset } from './stickyPortalUtils';

interface StickyPortalHeaderOptions {
  anchorElement: HTMLDivElement | null;
  headerElement: HTMLElement | null;
  sticky?: StickyProp;
}

export function useStickyPortalHeader({
  anchorElement,
  headerElement,
  sticky,
}: StickyPortalHeaderOptions) {
  const [placeholderHeight, setPlaceholderHeight] = useState(0);
  const [portalOffset, setPortalOffset] = useState(0);
  const [portalVisible, setPortalVisible] = useState(false);
  const normalizedSticky = normalizeStickyConfig(sticky);
  const hasSticky = !!normalizedSticky;
  const stickyOffset = normalizedSticky?.offset ?? '0px';
  const stickyPosition = normalizedSticky?.position ?? 'top';

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

    const resizeObserver = new ResizeObserver(updateHeight);

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

    const resizeObserver = new ResizeObserver(queuePortalVisibilityUpdate);

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

  const portalRootStyle = useMemo<Pick<CSSProperties, 'bottom' | 'top'>>(
    () =>
      stickyPosition === 'bottom'
        ? { bottom: stickyOffset, top: 'auto' }
        : { bottom: 'auto', top: stickyOffset },
    [stickyOffset, stickyPosition]
  );

  return {
    hasSticky,
    placeholderHeight,
    portalRootStyle,
    portalVisible,
    stickyPosition,
  };
}
