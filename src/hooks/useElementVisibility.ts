import { useCallback, useEffect, useState } from 'react';

function useElementVisibility<TElement extends HTMLElement>() {
  const [element, setElement] = useState<TElement | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const handleRef = useCallback((nextElement: TElement | null) => {
    setElement((currentElement) =>
      currentElement === nextElement ? currentElement : nextElement
    );
  }, []);

  useEffect(() => {
    if (!element) {
      setIsVisible(true);
      return;
    }

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
    });

    intersectionObserver.observe(element);

    return () => {
      intersectionObserver.disconnect();
    };
  }, [element]);

  return {
    isVisible,
    ref: handleRef,
  };
}

export default useElementVisibility;
