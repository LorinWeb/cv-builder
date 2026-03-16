import { useEffect, useState } from 'react';

import { joinClassNames } from '../../helpers/classNames';
import { AmbientDesignScene } from './AmbientDesignScene';

function getPrefersReducedMotion() {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function subscribeToMediaQuery(
  mediaQuery: MediaQueryList,
  listener: () => void
) {
  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', listener);

    return () => mediaQuery.removeEventListener('change', listener);
  }

  const legacyMediaQuery = mediaQuery as MediaQueryList & {
    addListener: (nextListener: () => void) => void;
    removeListener: (nextListener: () => void) => void;
  };

  legacyMediaQuery.addListener(listener);

  return () => legacyMediaQuery.removeListener(listener);
}

export function AmbientDesignLayer() {
  const [sceneReady, setSceneReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(getPrefersReducedMotion);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncPreference = () => {
      setReducedMotion(mediaQuery.matches);
    };

    syncPreference();

    return subscribeToMediaQuery(mediaQuery, syncPreference);
  }, []);

  const handleSceneReady = () => {
    setSceneReady(true);
  };

  return (
    <div
      aria-hidden="true"
      data-testid="ambient-design-layer"
      data-motion-mode={reducedMotion ? 'reduce' : 'dynamic'}
      data-scene-state={sceneReady ? 'ready' : 'loading'}
      className={joinClassNames(
        'AmbientDesignLayer hidden-for-media-print',
        sceneReady && 'is-visible'
      )}
    >
      <AmbientDesignScene
        reducedMotion={reducedMotion}
        onReady={handleSceneReady}
      />
    </div>
  );
}
