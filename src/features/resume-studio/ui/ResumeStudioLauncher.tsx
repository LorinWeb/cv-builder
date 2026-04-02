import { useEffect, useState } from 'react';

import {
  getResumeStudioState,
  initializeResumeStudio,
  isResumeStudioEnabled,
  publishResumeStudioPreview,
} from '../runtime';
import type { ResumeStudioState } from '../types';
import { ResumeStudioDialog } from './ResumeStudioDialog';

function readSessionOpenState() {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.sessionStorage.getItem('resume-studio-open') === 'true';
}

export function ResumeStudioLauncher() {
  const [state, setState] = useState<ResumeStudioState | null>(null);
  const [isOpen, setIsOpen] = useState(readSessionOpenState);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isResumeStudioEnabled()) {
      return;
    }

    let isSubscribed = true;

    async function loadState() {
      setIsLoading(true);

      try {
        const nextState = await getResumeStudioState();

        if (isSubscribed) {
          setState(nextState);
        }
      } catch (error) {
        if (isSubscribed) {
          setErrorMessage(
            error instanceof Error ? error.message : 'Could not load Resume Studio.'
          );
        }
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    }

    void loadState();

    return () => {
      isSubscribed = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.sessionStorage.setItem('resume-studio-open', String(isOpen));
  }, [isOpen]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const html = document.documentElement;
    const body = document.body;
    const appContainer = document.getElementById('root');
    const previousHtmlOverflow = html.style.overflow;
    const previousHtmlScrollbarGutter = html.style.scrollbarGutter;
    const previousBodyOverflow = body.style.overflow;
    const previousRootOverflow = appContainer?.style.overflow ?? '';

    if (isOpen) {
      html.dataset.resumeStudioOpen = 'true';
      body.dataset.resumeStudioOpen = 'true';
      html.style.overflow = 'hidden';
      html.style.scrollbarGutter = 'auto';
      body.style.overflow = 'hidden';
      if (appContainer) {
        appContainer.dataset.resumeStudioOpen = 'true';
        appContainer.style.overflow = 'hidden';
      }
    } else {
      delete html.dataset.resumeStudioOpen;
      delete body.dataset.resumeStudioOpen;
      html.style.overflow = '';
      html.style.scrollbarGutter = '';
      body.style.overflow = '';
      if (appContainer) {
        delete appContainer.dataset.resumeStudioOpen;
        appContainer.style.overflow = '';
      }
    }

    return () => {
      delete html.dataset.resumeStudioOpen;
      delete body.dataset.resumeStudioOpen;
      html.style.overflow = previousHtmlOverflow;
      html.style.scrollbarGutter = previousHtmlScrollbarGutter;
      body.style.overflow = previousBodyOverflow;
      if (appContainer) {
        delete appContainer.dataset.resumeStudioOpen;
        appContainer.style.overflow = previousRootOverflow;
      }
    };
  }, [isOpen]);

  if (!isResumeStudioEnabled()) {
    return null;
  }

  async function handleLaunch() {
    setErrorMessage(null);
    setIsBusy(true);

    try {
      const nextState = state?.isInitialized
        ? await getResumeStudioState()
        : await initializeResumeStudio();

      setState(nextState);
      if (nextState.draft) {
        publishResumeStudioPreview(nextState.draft);
      }
      setIsOpen(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Could not open Resume Studio.'
      );
    } finally {
      setIsBusy(false);
    }
  }

  const buttonLabel = isLoading
    ? 'Loading studio…'
    : state?.isInitialized
      ? 'Edit resume'
      : 'Create your resume';

  return (
    <>
      <div className="fixed bottom-5 right-5 z-50 print:hidden">
        <button
          data-testid="resume-studio-launcher"
          type="button"
          disabled={isLoading || isBusy}
          onClick={handleLaunch}
          className="rounded-full bg-[linear-gradient(135deg,var(--color-floating-action-start),var(--color-floating-action-end))] px-5 py-3 text-sm font-medium tracking-[0.01em] text-white shadow-[0_20px_40px_-24px_var(--color-floating-action-shadow)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isBusy ? 'Opening…' : buttonLabel}
        </button>
        {errorMessage ? (
          <p
            data-testid="resume-studio-error"
            className="mt-2 max-w-70 rounded-2xl bg-[rgba(155,44,44,0.92)] px-3 py-2 text-xs leading-5 text-white shadow-lg"
          >
            {errorMessage}
          </p>
        ) : null}
      </div>

      {state ? (
        <ResumeStudioDialog
          open={isOpen}
          onOpenChange={setIsOpen}
          onStateChange={setState}
          state={state}
        />
      ) : null}
    </>
  );
}
