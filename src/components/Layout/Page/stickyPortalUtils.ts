import type { NormalizedStickyConfig } from './stickyConfig';

export function getResolvedPortalOffset(
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

export function getPortalVisibility(
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
