import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

import type { ResumeSourceData } from '../../../data/types/resume';
import {
  createResumeStudioPreviewMessage,
  createResumeStudioScrollSyncSetMessage,
  getResumeStudioPreviewUrl,
  getResumeStudioScrollProgress,
  getResumeStudioScrollTopForProgress,
  isResumeStudioScrollSyncReadyMessage,
  isResumeStudioScrollSyncUpdateMessage,
  setResumeStudioScrollProgress,
} from '../runtime';
import {
  RESUME_STUDIO_PREVIEW_FRAME_HEIGHT,
  RESUME_STUDIO_PREVIEW_FRAME_WIDTH,
} from '../constants';

const SCROLL_SYNC_PROGRESS_EPSILON = 0.002;
const SCROLL_SYNC_SCROLL_TOP_EPSILON = 1;

interface ResumeStudioPreviewFrameProps {
  data: ResumeSourceData;
  editorViewportRef: RefObject<HTMLDivElement | null>;
}

function getPreviewScale(width: number) {
  if (width === 0) {
    return 1;
  }

  return width / RESUME_STUDIO_PREVIEW_FRAME_WIDTH;
}

function getPreviewViewportHeight(height: number, scale: number) {
  if (height === 0 || scale === 0) {
    return RESUME_STUDIO_PREVIEW_FRAME_HEIGHT;
  }

  return height / scale;
}

function hasMeaningfulProgressDelta(current: number, next: number) {
  return Math.abs(current - next) > SCROLL_SYNC_PROGRESS_EPSILON;
}

function hasMeaningfulScrollTopDelta(element: HTMLElement, progress: number) {
  return (
    Math.abs(element.scrollTop - getResumeStudioScrollTopForProgress(element, progress)) >
    SCROLL_SYNC_SCROLL_TOP_EPSILON
  );
}

export function ResumeStudioPreviewFrame({
  data,
  editorViewportRef,
}: ResumeStudioPreviewFrameProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const latestDataRef = useRef(data);
  const sharedProgressRef = useRef(0);
  const editorScrollFrameRef = useRef<number | null>(null);
  const editorResizeFrameRef = useRef<number | null>(null);
  const clearEditorSuppressionFrameRef = useRef<number | null>(null);
  const isFrameLoadedRef = useRef(false);
  const isPreviewReadyRef = useRef(false);
  const suppressedEditorScrollEventsRef = useRef(0);
  const [frameUrl] = useState(getResumeStudioPreviewUrl);
  const [containerHeight, setContainerHeight] = useState(0);
  const [scale, setScale] = useState(1);
  const [isFrameLoaded, setIsFrameLoaded] = useState(false);
  const iframeViewportHeight = getPreviewViewportHeight(containerHeight, scale);

  const postMessageToPreview = useCallback((message: unknown) => {
    const frameWindow = frameRef.current?.contentWindow;

    if (!frameWindow) {
      return;
    }

    frameWindow.postMessage(message, window.location.origin);
  }, []);

  const postPreviewMessage = useCallback((nextData: ResumeSourceData) => {
    postMessageToPreview(createResumeStudioPreviewMessage(nextData));
  }, [postMessageToPreview]);

  const postScrollSyncSet = useCallback((progress: number) => {
    if (!isFrameLoadedRef.current || !isPreviewReadyRef.current) {
      return;
    }

    postMessageToPreview(createResumeStudioScrollSyncSetMessage(progress));
  }, [postMessageToPreview]);

  const scheduleEditorSuppressionReset = useCallback(() => {
    if (clearEditorSuppressionFrameRef.current !== null) {
      cancelAnimationFrame(clearEditorSuppressionFrameRef.current);
    }

    clearEditorSuppressionFrameRef.current = requestAnimationFrame(() => {
      suppressedEditorScrollEventsRef.current = 0;
      clearEditorSuppressionFrameRef.current = null;
    });
  }, []);

  const applyEditorProgress = useCallback((progress: number) => {
    const editorViewport = editorViewportRef.current;

    if (!editorViewport || !hasMeaningfulScrollTopDelta(editorViewport, progress)) {
      return;
    }

    suppressedEditorScrollEventsRef.current = 1;
    setResumeStudioScrollProgress(editorViewport, progress);
    scheduleEditorSuppressionReset();
  }, [editorViewportRef, scheduleEditorSuppressionReset]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const updateScale = () => {
      setContainerHeight(container.clientHeight);
      setScale(getPreviewScale(container.clientWidth));
    };

    updateScale();

    const resizeObserver = new ResizeObserver(updateScale);

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    latestDataRef.current = data;

    if (isFrameLoaded) {
      postPreviewMessage(data);
    }
  }, [data, isFrameLoaded, postPreviewMessage]);

  useEffect(() => {
    if (isFrameLoaded) {
      postPreviewMessage(latestDataRef.current);
    }
  }, [isFrameLoaded, postPreviewMessage]);

  useEffect(() => {
    const editorViewport = editorViewportRef.current;

    if (!editorViewport) {
      return;
    }

    const syncEditorProgress = () => {
      if (suppressedEditorScrollEventsRef.current > 0) {
        suppressedEditorScrollEventsRef.current -= 1;
        return;
      }

      if (editorScrollFrameRef.current !== null) {
        cancelAnimationFrame(editorScrollFrameRef.current);
      }

      editorScrollFrameRef.current = requestAnimationFrame(() => {
        editorScrollFrameRef.current = null;
        const nextProgress = getResumeStudioScrollProgress(editorViewport);

        if (!hasMeaningfulProgressDelta(sharedProgressRef.current, nextProgress)) {
          return;
        }

        sharedProgressRef.current = nextProgress;
        postScrollSyncSet(nextProgress);
      });
    };

    const scheduleEditorReapply = () => {
      if (editorResizeFrameRef.current !== null) {
        cancelAnimationFrame(editorResizeFrameRef.current);
      }

      editorResizeFrameRef.current = requestAnimationFrame(() => {
        editorResizeFrameRef.current = null;
        applyEditorProgress(sharedProgressRef.current);
        postScrollSyncSet(sharedProgressRef.current);
      });
    };

    const resizeObserver = new ResizeObserver(scheduleEditorReapply);
    const editorContent = editorViewport.firstElementChild;

    resizeObserver.observe(editorViewport);

    if (editorContent instanceof HTMLElement) {
      resizeObserver.observe(editorContent);
    }

    editorViewport.addEventListener('scroll', syncEditorProgress, { passive: true });

    return () => {
      if (editorScrollFrameRef.current !== null) {
        cancelAnimationFrame(editorScrollFrameRef.current);
      }

      if (editorResizeFrameRef.current !== null) {
        cancelAnimationFrame(editorResizeFrameRef.current);
      }

      if (clearEditorSuppressionFrameRef.current !== null) {
        cancelAnimationFrame(clearEditorSuppressionFrameRef.current);
      }

      resizeObserver.disconnect();
      editorViewport.removeEventListener('scroll', syncEditorProgress);
    };
  }, [applyEditorProgress, editorViewportRef, isFrameLoaded, postScrollSyncSet]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== frameRef.current?.contentWindow
      ) {
        return;
      }

      if (isResumeStudioScrollSyncReadyMessage(event.data)) {
        isPreviewReadyRef.current = true;
        postScrollSyncSet(sharedProgressRef.current);
        return;
      }

      if (!isResumeStudioScrollSyncUpdateMessage(event.data)) {
        return;
      }

      if (!hasMeaningfulProgressDelta(sharedProgressRef.current, event.data.progress)) {
        return;
      }

      sharedProgressRef.current = event.data.progress;
      applyEditorProgress(event.data.progress);
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [applyEditorProgress, editorViewportRef, postScrollSyncSet]);

  return (
    <div
      ref={containerRef}
      data-testid="resume-studio-preview-pane"
      className="resume-studio-preview-pane h-full overflow-hidden"
    >
      <div
        data-testid="resume-studio-preview-viewport"
        className="h-full w-full overflow-hidden"
      >
        <div
          data-testid="resume-studio-preview-shell"
          className="h-full w-full"
        >
          <div
            data-testid="resume-studio-preview-stage"
            className="resume-studio-preview-stage h-full w-full overflow-hidden bg-white"
          >
            <iframe
              ref={frameRef}
              data-testid="resume-studio-preview-frame"
              title="Resume Studio preview"
              src={frameUrl}
              onLoad={() => {
                isFrameLoadedRef.current = true;
                isPreviewReadyRef.current = false;
                setIsFrameLoaded(true);
              }}
              className="block border-0 bg-white"
              style={{
                height: iframeViewportHeight,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                width: RESUME_STUDIO_PREVIEW_FRAME_WIDTH,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
