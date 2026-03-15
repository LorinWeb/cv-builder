import {
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type Ref,
} from 'react';

export type StickyPosition = 'top' | 'bottom';

export interface StickyConfig {
  offset?: number | string;
  position?: StickyPosition;
}

export type StickyProp = boolean | StickyConfig;

export interface NormalizedStickyConfig {
  offset: string;
  position: StickyPosition;
}

function getResolvedStickyOffset(element: HTMLElement, position: StickyPosition) {
  const computedStyle = window.getComputedStyle(element);

  if (position === 'bottom') {
    return parseFloat(computedStyle.bottom) || 0;
  }

  return parseFloat(computedStyle.top) || 0;
}

function isStickyElementStuck(
  element: HTMLElement,
  sticky: NormalizedStickyConfig
) {
  const computedStyle = window.getComputedStyle(element);

  if (computedStyle.position !== 'sticky' || window.scrollY <= 0) {
    return false;
  }

  const rect = element.getBoundingClientRect();

  if (sticky.position === 'bottom') {
    const stickyEdge = window.innerHeight - getResolvedStickyOffset(element, sticky.position);

    return Math.abs(rect.bottom - stickyEdge) <= 1.5;
  }

  const stickyEdge = getResolvedStickyOffset(element, sticky.position);

  return Math.abs(rect.top - stickyEdge) <= 1.5;
}

function normalizeStickyOffset(offset: StickyConfig['offset']) {
  if (typeof offset === 'number') {
    return `${offset}px`;
  }

  return offset ?? '0px';
}

export function normalizeStickyConfig(
  sticky?: StickyProp
): NormalizedStickyConfig | null {
  if (!sticky) {
    return null;
  }

  if (sticky === true) {
    return {
      offset: '0px',
      position: 'top',
    };
  }

  return {
    offset: normalizeStickyOffset(sticky.offset),
    position: sticky.position ?? 'top',
  };
}

export function getStickyStyle(
  sticky: NormalizedStickyConfig | null
): Pick<CSSProperties, 'bottom' | 'position' | 'top'> | undefined {
  if (!sticky) {
    return undefined;
  }

  if (sticky.position === 'bottom') {
    return {
      bottom: sticky.offset,
      position: 'sticky',
      top: 'auto',
    };
  }

  return {
    bottom: 'auto',
    position: 'sticky',
    top: sticky.offset,
  };
}

export function assignRef<TElement>(
  ref: Ref<TElement> | undefined,
  element: TElement | null
) {
  if (!ref) {
    return;
  }

  if (typeof ref === 'function') {
    ref(element);
    return;
  }

  ref.current = element;
}

export function useStickyState<TElement extends HTMLElement>(sticky?: StickyProp) {
  const elementRef = useRef<TElement | null>(null);
  const normalizedSticky = normalizeStickyConfig(sticky);
  const stickyStyle = getStickyStyle(normalizedSticky);
  const stickyOffset = normalizedSticky?.offset;
  const stickyPosition = normalizedSticky?.position;
  const hasSticky = !!normalizedSticky;

  const updateStickyState = useEffectEvent(() => {
    const element = elementRef.current;

    if (!element) {
      return;
    }

    if (!normalizedSticky) {
      element.removeAttribute('data-stuck');
      return;
    }

    element.setAttribute(
      'data-stuck',
      String(isStickyElementStuck(element, normalizedSticky))
    );
  });

  useLayoutEffect(() => {
    updateStickyState();
  }, [hasSticky, stickyOffset, stickyPosition, updateStickyState]);

  useEffect(() => {
    const element = elementRef.current;

    if (!element || !hasSticky) {
      element?.removeAttribute('data-stuck');
      return;
    }

    let animationFrameId = 0;

    const handleChange = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = requestAnimationFrame(() => {
        animationFrameId = 0;
        updateStickyState();
      });
    };

    handleChange();

    const resizeObserver = new ResizeObserver(() => {
      handleChange();
    });

    resizeObserver.observe(element);
    window.addEventListener('resize', handleChange, { passive: true });
    window.addEventListener('scroll', handleChange, { passive: true });

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      resizeObserver.disconnect();
      window.removeEventListener('resize', handleChange);
      window.removeEventListener('scroll', handleChange);
      element.removeAttribute('data-stuck');
    };
  }, [hasSticky, stickyOffset, stickyPosition, updateStickyState]);

  return {
    normalizedSticky,
    ref: (element: TElement | null) => {
      elementRef.current = element;
    },
    stickyStyle,
  };
}
