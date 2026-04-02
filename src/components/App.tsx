import { Suspense, lazy, useEffect, useRef, type ReactNode, type RefObject } from 'react';

import { AmbientDesignLayer } from './AmbientDesignLayer';
import { MarkdownResume } from './MarkdownResume';
import type { ResumeRuntimeData } from '../data/types/resume';
import {
  createResumeStudioScrollSyncReadyMessage,
  createResumeStudioScrollSyncUpdateMessage,
  getResumeStudioScrollProgress,
  getResumeStudioScrollTopForProgress,
  isResumeStudioScrollSyncSetMessage,
  setResumeStudioScrollProgress,
} from '../features/resume-studio/runtime';
import { StudioScrollArea } from '../features/resume-studio/ui/StudioScrollArea';

const SCROLL_SYNC_PROGRESS_EPSILON = 0.002;
const SCROLL_SYNC_SCROLL_TOP_EPSILON = 1;

interface AppProps {
  data: ResumeRuntimeData;
  isResumeStudioPreview?: boolean;
}

const ResumeStudioLauncher =
  import.meta.env.DEV
    ? lazy(async () => {
        const module = await import('../features/resume-studio');

        return { default: module.ResumeStudioLauncher };
      })
    : null;

function ResumeStudioLauncherFallback() {
  return (
    <div className="fixed bottom-5 right-5 z-50 print:hidden">
      <button
        data-testid="resume-studio-launcher-loading"
        type="button"
        disabled
        className="rounded-full bg-[linear-gradient(135deg,var(--color-floating-action-start),var(--color-floating-action-end))] px-5 py-3 text-sm font-medium tracking-[0.01em] text-white shadow-[0_20px_40px_-24px_var(--color-floating-action-shadow)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        Loading studio...
      </button>
    </div>
  );
}

function ResumeStudioLauncherSlot() {
  if (!ResumeStudioLauncher) {
    return null;
  }

  return (
    <Suspense fallback={<ResumeStudioLauncherFallback />}>
      <ResumeStudioLauncher />
    </Suspense>
  );
}

function useResumeStudioPreviewScrollSync(
  viewportRef: RefObject<HTMLDivElement | null>
) {
  const lastProgressRef = useRef(0);
  const clearSuppressionFrameRef = useRef<number | null>(null);
  const scrollFrameRef = useRef<number | null>(null);
  const resizeFrameRef = useRef<number | null>(null);
  const suppressedScrollEventsRef = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined' || window.parent === window) {
      return;
    }

    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    const scheduleSuppressionReset = () => {
      if (clearSuppressionFrameRef.current !== null) {
        cancelAnimationFrame(clearSuppressionFrameRef.current);
      }

      clearSuppressionFrameRef.current = requestAnimationFrame(() => {
        suppressedScrollEventsRef.current = 0;
        clearSuppressionFrameRef.current = null;
      });
    };

    const applyProgress = (progress: number) => {
      const nextScrollTop = getResumeStudioScrollTopForProgress(viewport, progress);

      lastProgressRef.current = progress;

      if (Math.abs(viewport.scrollTop - nextScrollTop) <= SCROLL_SYNC_SCROLL_TOP_EPSILON) {
        return;
      }

      suppressedScrollEventsRef.current = 1;
      setResumeStudioScrollProgress(viewport, progress);
      scheduleSuppressionReset();
    };

    const postToParent = (message: unknown) => {
      window.parent.postMessage(message, window.location.origin);
    };

    const handleScroll = () => {
      if (suppressedScrollEventsRef.current > 0) {
        suppressedScrollEventsRef.current -= 1;
        return;
      }

      if (scrollFrameRef.current !== null) {
        cancelAnimationFrame(scrollFrameRef.current);
      }

      scrollFrameRef.current = requestAnimationFrame(() => {
        scrollFrameRef.current = null;
        const nextProgress = getResumeStudioScrollProgress(viewport);

        if (Math.abs(lastProgressRef.current - nextProgress) <= SCROLL_SYNC_PROGRESS_EPSILON) {
          return;
        }

        lastProgressRef.current = nextProgress;
        postToParent(createResumeStudioScrollSyncUpdateMessage(nextProgress));
      });
    };

    const handleMessage = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== window.parent ||
        !isResumeStudioScrollSyncSetMessage(event.data)
      ) {
        return;
      }

      applyProgress(event.data.progress);
    };

    const scheduleReapply = () => {
      if (resizeFrameRef.current !== null) {
        cancelAnimationFrame(resizeFrameRef.current);
      }

      resizeFrameRef.current = requestAnimationFrame(() => {
        resizeFrameRef.current = null;
        applyProgress(lastProgressRef.current);
      });
    };

    const resizeObserver = new ResizeObserver(scheduleReapply);
    const content = viewport.firstElementChild;

    resizeObserver.observe(viewport);

    if (content instanceof HTMLElement) {
      resizeObserver.observe(content);
    }

    viewport.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('message', handleMessage);
    postToParent(createResumeStudioScrollSyncReadyMessage());

    return () => {
      if (clearSuppressionFrameRef.current !== null) {
        cancelAnimationFrame(clearSuppressionFrameRef.current);
      }

      if (scrollFrameRef.current !== null) {
        cancelAnimationFrame(scrollFrameRef.current);
      }

      if (resizeFrameRef.current !== null) {
        cancelAnimationFrame(resizeFrameRef.current);
      }

      resizeObserver.disconnect();
      viewport.removeEventListener('scroll', handleScroll);
      window.removeEventListener('message', handleMessage);
    };
  }, [viewportRef]);
}

function ResumeStudioPreviewScrollArea({ children }: { children: ReactNode }) {
  const viewportRef = useRef<HTMLDivElement | null>(null);

  useResumeStudioPreviewScrollSync(viewportRef);

  return (
    <StudioScrollArea
      contentClassName="min-h-full"
      rootClassName="h-screen w-screen"
      rootTestId="resume-studio-preview-scroll-area"
      viewportClassName="h-screen w-screen overscroll-contain"
      viewportRef={viewportRef}
      viewportTestId="resume-studio-preview-scroll-area-viewport"
    >
      {children}
    </StudioScrollArea>
  );
}

function App({ data, isResumeStudioPreview = false }: AppProps) {
  const resumeContent = (
    <MarkdownResume data={data} isResumeStudioPreview={isResumeStudioPreview} />
  );

  if (isResumeStudioPreview) {
    return (
      <>
        <AmbientDesignLayer />
        <ResumeStudioPreviewScrollArea>{resumeContent}</ResumeStudioPreviewScrollArea>
      </>
    );
  }

  return (
    <>
      <ResumeStudioLauncherSlot />
      <AmbientDesignLayer />
      {resumeContent}
    </>
  );
}

export default App;
