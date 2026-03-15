import { useEffect, useState } from 'react';

function useElementVisibility<TElement extends HTMLElement>() {
  const [element, setElement] = useState<TElement | null>(null);
  const [isVisible, setIsVisible] = useState(true);

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
    ref: setElement as (element: TElement | null) => void,
  };
}

export default useElementVisibility;
