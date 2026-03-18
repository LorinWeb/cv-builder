import { useEffect, useRef, useState } from 'react';

import type { ResumeSourceData } from '../../../data/types/resume';
import {
  createResumeStudioPreviewMessage,
  getResumeStudioPreviewUrl,
  RESUME_STUDIO_PREVIEW_EVENT,
} from '../runtime';
import {
  RESUME_STUDIO_PREVIEW_FRAME_HEIGHT,
  RESUME_STUDIO_PREVIEW_FRAME_WIDTH,
} from '../constants';

interface ResumeStudioPreviewFrameProps {
  data: ResumeSourceData;
}

function getPreviewScale(width: number, height: number) {
  if (width === 0 || height === 0) {
    return 1;
  }

  return Math.min(
    width / RESUME_STUDIO_PREVIEW_FRAME_WIDTH,
    height / RESUME_STUDIO_PREVIEW_FRAME_HEIGHT
  );
}

export function ResumeStudioPreviewFrame({
  data,
}: ResumeStudioPreviewFrameProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const latestDataRef = useRef(data);
  const [frameUrl] = useState(getResumeStudioPreviewUrl);
  const [scale, setScale] = useState(1);
  const [isFrameLoaded, setIsFrameLoaded] = useState(false);

  function postPreviewMessage(nextData: ResumeSourceData) {
    const frameWindow = frameRef.current?.contentWindow;

    if (!frameWindow) {
      return;
    }

    frameWindow.postMessage(
      createResumeStudioPreviewMessage(nextData),
      window.location.origin
    );
  }

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const updateScale = () => {
      setScale(getPreviewScale(container.clientWidth - 24, container.clientHeight - 24));
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

    if (!isFrameLoaded) {
      return;
    }

    postPreviewMessage(data);
  }, [data, isFrameLoaded]);

  useEffect(() => {
    if (!isFrameLoaded) {
      return;
    }

    postPreviewMessage(latestDataRef.current);
  }, [isFrameLoaded]);

  useEffect(() => {
    function handlePreviewEvent(event: Event) {
      const previewEvent = event as CustomEvent<ResumeSourceData>;

      latestDataRef.current = previewEvent.detail;

      if (!isFrameLoaded) {
        return;
      }

      postPreviewMessage(previewEvent.detail);
    }

    window.addEventListener(RESUME_STUDIO_PREVIEW_EVENT, handlePreviewEvent);

    return () => {
      window.removeEventListener(RESUME_STUDIO_PREVIEW_EVENT, handlePreviewEvent);
    };
  }, [isFrameLoaded]);

  return (
    <aside className="rounded-[28px] border border-[rgba(74,127,122,0.14)] bg-[rgba(247,250,247,0.94)] p-4 shadow-[0_28px_60px_-44px_rgba(11,37,31,0.45)]">
      <div className="mb-3">
        <p className="m-0 text-sm font-medium text-(--color-primary)">Live preview</p>
        <p className="mt-1 text-xs leading-5 text-(--color-secondary)">
          Changes render instantly here and autosave after a short pause.
        </p>
      </div>

      <div
        ref={containerRef}
        data-testid="resume-studio-preview-viewport"
        className="relative h-135 overflow-hidden rounded-3xl border border-[rgba(74,127,122,0.14)] bg-[linear-gradient(180deg,#dfe9e3,#f1f5f0)]"
      >
        <div
          className="absolute inset-3 flex items-center justify-center"
        >
          <div
            data-testid="resume-studio-preview-shell"
            className="relative shrink-0 overflow-hidden rounded-[14px] shadow-[0_24px_48px_-36px_rgba(11,37,31,0.55)]"
            style={{
              height: RESUME_STUDIO_PREVIEW_FRAME_HEIGHT * scale,
              width: RESUME_STUDIO_PREVIEW_FRAME_WIDTH * scale,
            }}
          >
            <iframe
              ref={frameRef}
              data-testid="resume-studio-preview-frame"
              title="Resume Studio preview"
              src={frameUrl}
              onLoad={() => setIsFrameLoaded(true)}
              className="pointer-events-none border-0 bg-[#e9efea]"
              style={{
                height: RESUME_STUDIO_PREVIEW_FRAME_HEIGHT,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                width: RESUME_STUDIO_PREVIEW_FRAME_WIDTH,
              }}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
