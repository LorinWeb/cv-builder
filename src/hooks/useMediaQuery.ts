import { useSyncExternalStore } from 'react';

function subscribeToMediaQuery(query: string, onStoreChange: () => void) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const mediaQueryList = window.matchMedia(query);
  const handleChange = () => {
    onStoreChange();
  };

  mediaQueryList.addEventListener('change', handleChange);

  return () => {
    mediaQueryList.removeEventListener('change', handleChange);
  };
}

function getMediaQuerySnapshot(query: string) {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.matchMedia(query).matches;
}

function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onStoreChange) => subscribeToMediaQuery(query, onStoreChange),
    () => getMediaQuerySnapshot(query),
    () => false
  );
}

export default useMediaQuery;
