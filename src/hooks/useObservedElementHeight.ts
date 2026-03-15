import { useLayoutEffect, useState } from 'react';

function useObservedElementHeight<TElement extends HTMLElement>() {
  const [element, setElement] = useState<TElement | null>(null);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    if (!element) {
      setHeight(0);
      return;
    }

    const updateHeight = () => {
      const nextHeight = element.getBoundingClientRect().height;

      setHeight((currentHeight) =>
        currentHeight === nextHeight ? currentHeight : nextHeight
      );
    };

    let animationFrameId = 0;

    const queueHeightUpdate = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = requestAnimationFrame(() => {
        animationFrameId = 0;
        updateHeight();
      });
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(() => {
      queueHeightUpdate();
    });

    resizeObserver.observe(element);

    window.addEventListener('resize', queueHeightUpdate, { passive: true });
    window.addEventListener('scroll', queueHeightUpdate, { passive: true });

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      resizeObserver.disconnect();
      window.removeEventListener('resize', queueHeightUpdate);
      window.removeEventListener('scroll', queueHeightUpdate);
    };
  }, [element]);

  return {
    height,
    ref: setElement as (element: TElement | null) => void,
  };
}

export default useObservedElementHeight;
