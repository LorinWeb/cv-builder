import { useEffect, useEffectEvent, useRef } from 'react';

import {
  drawAmbientDesignScene,
  getAmbientMotionEnabled,
  getPrimaryColor,
  getScrollProgress,
  type RuntimeState,
} from './sceneDrawing';

export interface AmbientDesignSceneProps {
  reducedMotion: boolean;
  onReady?: () => void;
}

export function AmbientDesignScene({
  reducedMotion,
  onReady,
}: AmbientDesignSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hasNotifiedReadyRef = useRef(false);
  const onReadyEvent = useEffectEvent(() => {
    onReady?.();
  });

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');

    if (!context) {
      return;
    }

    const runtime: RuntimeState = {
      dpr: 1,
      height: 0,
      primary: getPrimaryColor(),
      scrollProgress: getScrollProgress(),
      width: 0,
    };
    const motionEnabled = getAmbientMotionEnabled(reducedMotion);

    const notifyReady = () => {
      if (hasNotifiedReadyRef.current) {
        return;
      }

      hasNotifiedReadyRef.current = true;
      onReadyEvent();
    };

    const resizeCanvas = () => {
      runtime.width = window.innerWidth;
      runtime.height = window.innerHeight;
      runtime.primary = getPrimaryColor();
      runtime.dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(runtime.width * runtime.dpr));
      canvas.height = Math.max(1, Math.round(runtime.height * runtime.dpr));
    };

    const renderFrame = () => {
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.setTransform(runtime.dpr, 0, 0, runtime.dpr, 0, 0);
      drawAmbientDesignScene(context, runtime, motionEnabled);
      notifyReady();
    };

    const handleResize = () => {
      resizeCanvas();
      renderFrame();
    };

    const handleScroll = () => {
      if (!motionEnabled) {
        return;
      }

      runtime.scrollProgress = getScrollProgress();
      renderFrame();
    };

    resizeCanvas();
    renderFrame();

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [onReadyEvent, reducedMotion]);

  return (
    <canvas
      data-testid="ambient-design-canvas"
      data-animation-mode={reducedMotion ? 'static' : 'running'}
      className="AmbientDesignLayerCanvas"
      ref={canvasRef}
    />
  );
}
