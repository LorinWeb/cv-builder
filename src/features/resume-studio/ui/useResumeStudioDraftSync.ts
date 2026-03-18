import {
  useEffect,
  useEffectEvent,
  useRef,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react';
import type { UseFormReturn } from 'react-hook-form';

import type { ResumeSourceData } from '../../../data/types/resume';
import { applyResumeStudioDraft, toResumeStudioDraft } from '../draft';
import { RESUME_STUDIO_AUTOSAVE_DELAY_MS } from '../constants';
import { publishResumeStudioPreview } from '../runtime';
import type { ResumeStudioDraft, ResumeStudioState } from '../types';

interface UseResumeStudioDraftSyncProps {
  form: UseFormReturn<ResumeStudioDraft>;
  hasUnsavedChanges: boolean;
  isAutosavePaused: boolean;
  lastSavedDraftSignatureRef: MutableRefObject<string | null>;
  liveDraftRef: MutableRefObject<ResumeStudioDraft | null>;
  liveDraftSignatureRef: MutableRefObject<string | null>;
  onAutosaveDraft: (values: ResumeStudioDraft) => Promise<ResumeStudioState | null>;
  open: boolean;
  persistedDraftRef: MutableRefObject<ResumeStudioDraft | null>;
  setHasUnsavedChanges: Dispatch<SetStateAction<boolean>>;
  sourceDraftRef: MutableRefObject<ResumeSourceData | null>;
  state: Pick<ResumeStudioState, 'activeVersionId' | 'draft' | 'draftUpdatedAt'>;
}

export function serializeResumeStudioDraft(draft: ResumeStudioDraft) {
  return JSON.stringify(sortResumeStudioDraftValue(draft));
}

function sortResumeStudioDraftValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortResumeStudioDraftValue);
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.keys(value)
    .sort()
    .reduce<Record<string, unknown>>((sortedValue, key) => {
      sortedValue[key] = sortResumeStudioDraftValue(
        (value as Record<string, unknown>)[key]
      );
      return sortedValue;
    }, {});
}

export function mergeResumeStudioDraft(
  source: ResumeStudioDraft,
  patch: Partial<ResumeStudioDraft>
): ResumeStudioDraft {
  const nextBasics = {
    ...source.basics,
  };

  for (const [key, value] of Object.entries(patch.basics || {})) {
    if (value !== undefined) {
      nextBasics[key as keyof ResumeStudioDraft['basics']] = value;
    }
  }

  return {
    basics: nextBasics,
    education: patch.education ?? source.education,
    impact: patch.impact ?? source.impact,
    skills: patch.skills ?? source.skills,
    work: patch.work ?? source.work,
  };
}

export function useResumeStudioDraftSync({
  form,
  hasUnsavedChanges,
  isAutosavePaused,
  lastSavedDraftSignatureRef,
  liveDraftRef,
  liveDraftSignatureRef,
  onAutosaveDraft,
  open,
  persistedDraftRef,
  setHasUnsavedChanges,
  sourceDraftRef,
  state,
}: UseResumeStudioDraftSyncProps) {
  const autosaveTimeoutRef = useRef<number | null>(null);
  const draftSyncFrameRef = useRef<number | null>(null);
  const previousActiveVersionIdRef = useRef(state.activeVersionId);
  const hasUnsavedChangesRef = useRef(hasUnsavedChanges);
  const isAutosavePausedRef = useRef(isAutosavePaused);
  const openRef = useRef(open);

  function clearDraftSyncFrame() {
    if (draftSyncFrameRef.current === null) {
      return;
    }

    window.cancelAnimationFrame(draftSyncFrameRef.current);
    draftSyncFrameRef.current = null;
  }

  function clearAutosaveTimeout() {
    if (autosaveTimeoutRef.current === null) {
      return;
    }

    window.clearTimeout(autosaveTimeoutRef.current);
    autosaveTimeoutRef.current = null;
  }

  const scheduleAutosave = useEffectEvent((draftSignature: string) => {
    if (
      !openRef.current ||
      isAutosavePausedRef.current ||
      draftSignature === lastSavedDraftSignatureRef.current
    ) {
      return;
    }

    if (autosaveTimeoutRef.current !== null) {
      return;
    }

    autosaveTimeoutRef.current = window.setTimeout(() => {
      const liveDraft = liveDraftRef.current;

      if (!liveDraft) {
        return;
      }

      void onAutosaveDraft(liveDraft);
    }, RESUME_STUDIO_AUTOSAVE_DELAY_MS);
  });

  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  useEffect(() => {
    isAutosavePausedRef.current = isAutosavePaused;
  }, [isAutosavePaused]);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    return () => {
      clearDraftSyncFrame();
      clearAutosaveTimeout();
    };
  }, []);

  useEffect(() => {
    sourceDraftRef.current = state.draft;

    if (!state.draft) {
      clearAutosaveTimeout();
      persistedDraftRef.current = null;
      liveDraftRef.current = null;
      liveDraftSignatureRef.current = null;
      lastSavedDraftSignatureRef.current = null;
      setHasUnsavedChanges(false);
      return;
    }

    const nextPersistedDraft = toResumeStudioDraft(state.draft);
    const nextDraftSignature = serializeResumeStudioDraft(nextPersistedDraft);
    const currentLiveDraft = mergeResumeStudioDraft(
      nextPersistedDraft,
      form.getValues() as Partial<ResumeStudioDraft>
    );
    const currentLiveDraftSignature = serializeResumeStudioDraft(currentLiveDraft);
    const didActiveVersionChange =
      previousActiveVersionIdRef.current !== state.activeVersionId;
    const shouldResetForm =
      didActiveVersionChange ||
      (!hasUnsavedChangesRef.current && currentLiveDraftSignature !== nextDraftSignature);

    clearAutosaveTimeout();
    previousActiveVersionIdRef.current = state.activeVersionId;
    persistedDraftRef.current = nextPersistedDraft;
    liveDraftRef.current = shouldResetForm ? nextPersistedDraft : currentLiveDraft;
    liveDraftSignatureRef.current = shouldResetForm
      ? nextDraftSignature
      : currentLiveDraftSignature;
    lastSavedDraftSignatureRef.current = nextDraftSignature;
    setHasUnsavedChanges(
      shouldResetForm ? false : currentLiveDraftSignature !== nextDraftSignature
    );

    if (shouldResetForm) {
      form.reset(nextPersistedDraft);
    }

    if (open) {
      publishResumeStudioPreview(
        applyResumeStudioDraft(state.draft, liveDraftRef.current)
      );
    }
  }, [
    form,
    lastSavedDraftSignatureRef,
    liveDraftRef,
    liveDraftSignatureRef,
    open,
    persistedDraftRef,
    setHasUnsavedChanges,
    sourceDraftRef,
    state.activeVersionId,
    state.draft,
    state.draftUpdatedAt,
  ]);

  useEffect(() => {
    if (!open) {
      clearAutosaveTimeout();
      return;
    }

    const sourceDraft = sourceDraftRef.current;
    const liveDraft = liveDraftRef.current;

    if (!sourceDraft || !liveDraft) {
      return;
    }

    publishResumeStudioPreview(applyResumeStudioDraft(sourceDraft, liveDraft));
  }, [liveDraftRef, open, sourceDraftRef]);

  useEffect(() => {
    if (isAutosavePaused) {
      clearAutosaveTimeout();
      return;
    }

    const liveDraft = liveDraftRef.current;

    if (!hasUnsavedChanges || !liveDraft) {
      return;
    }

    scheduleAutosave(serializeResumeStudioDraft(liveDraft));
  }, [hasUnsavedChanges, isAutosavePaused, liveDraftRef, scheduleAutosave]);

  const syncLiveDraftFromForm = useEffectEvent(() => {
    const persistedDraft = persistedDraftRef.current;
    const sourceDraft = sourceDraftRef.current;

    if (!persistedDraft || !sourceDraft) {
      return;
    }

    const nextLiveDraft = mergeResumeStudioDraft(
      persistedDraft,
      form.getValues() as Partial<ResumeStudioDraft>
    );
    const nextLiveDraftSignature = serializeResumeStudioDraft(nextLiveDraft);
    const nextHasUnsavedChanges =
      nextLiveDraftSignature !== lastSavedDraftSignatureRef.current;

    if (nextLiveDraftSignature === liveDraftSignatureRef.current) {
      return;
    }

    liveDraftRef.current = nextLiveDraft;
    liveDraftSignatureRef.current = nextLiveDraftSignature;
    setHasUnsavedChanges((current) =>
      current === nextHasUnsavedChanges ? current : nextHasUnsavedChanges
    );

    if (openRef.current) {
      publishResumeStudioPreview(applyResumeStudioDraft(sourceDraft, nextLiveDraft));
    }

    if (!nextHasUnsavedChanges) {
      clearAutosaveTimeout();
      return;
    }

    scheduleAutosave(nextLiveDraftSignature);
  });

  const scheduleLiveDraftSync = useEffectEvent(() => {
    if (draftSyncFrameRef.current !== null) {
      return;
    }

    draftSyncFrameRef.current = window.requestAnimationFrame(() => {
      draftSyncFrameRef.current = null;
      syncLiveDraftFromForm();
    });
  });

  useEffect(() => {
    const subscription = form.subscribe({
      formState: {
        values: true,
      },
      callback: () => {
        syncLiveDraftFromForm();
      },
    });

    return () => {
      subscription();
      clearDraftSyncFrame();
    };
  }, [
    form,
    syncLiveDraftFromForm,
  ]);

  return scheduleLiveDraftSync;
}
