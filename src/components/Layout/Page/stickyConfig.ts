import type { CSSProperties, Ref } from 'react';

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
