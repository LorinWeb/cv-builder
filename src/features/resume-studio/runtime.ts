import type { ResumeSourceData } from '../../data/types/resume';
import { redactResumeData } from '../pdf-download/build';
import {
  RESUME_STUDIO_API_ROOT,
  RESUME_STUDIO_PREVIEW_MESSAGE_TYPE,
  RESUME_STUDIO_PREVIEW_QUERY_PARAM,
  RESUME_STUDIO_SCROLL_SYNC_READY_MESSAGE_TYPE,
  RESUME_STUDIO_SCROLL_SYNC_SET_MESSAGE_TYPE,
  RESUME_STUDIO_SCROLL_SYNC_UPDATE_MESSAGE_TYPE,
} from './constants';
import type {
  ResumeStudioApiErrorPayload,
  ResumeStudioCreateVersionPayload,
  ResumeStudioDraftPayload,
  ResumeStudioState,
} from './types';

export const RESUME_STUDIO_PREVIEW_EVENT = 'resume-studio:preview-data';

interface ResumeStudioPreviewMessage {
  data: ReturnType<typeof redactResumeData>;
  type: typeof RESUME_STUDIO_PREVIEW_MESSAGE_TYPE;
}

interface ResumeStudioScrollSyncReadyMessage {
  type: typeof RESUME_STUDIO_SCROLL_SYNC_READY_MESSAGE_TYPE;
}

interface ResumeStudioScrollSyncProgressMessage {
  progress: number;
}

interface ResumeStudioScrollSyncSetMessage
  extends ResumeStudioScrollSyncProgressMessage {
  type: typeof RESUME_STUDIO_SCROLL_SYNC_SET_MESSAGE_TYPE;
}

interface ResumeStudioScrollSyncUpdateMessage
  extends ResumeStudioScrollSyncProgressMessage {
  type: typeof RESUME_STUDIO_SCROLL_SYNC_UPDATE_MESSAGE_TYPE;
}

export class ResumeStudioApiError extends Error {
  fieldErrors?: Record<string, string>;

  constructor(message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.fieldErrors = fieldErrors;
  }
}

const RESUME_STUDIO_JSON_HEADERS = {
  'Content-Type': 'application/json',
};

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${RESUME_STUDIO_API_ROOT}${path}`, init);

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ResumeStudioApiErrorPayload | null;

    throw new ResumeStudioApiError(
      payload?.error || `Resume Studio request failed with ${response.status}.`,
      payload?.fieldErrors
    );
  }

  return (await response.json()) as T;
}

function requestJsonWithPayload<T>(
  path: string,
  method: 'POST' | 'PUT',
  payload: unknown
) {
  return requestJson<T>(path, {
    body: JSON.stringify(payload),
    headers: RESUME_STUDIO_JSON_HEADERS,
    method,
  });
}

export function isResumeStudioEnabled() {
  return import.meta.env.DEV;
}

export function isResumeStudioPreviewMode() {
  if (typeof window === 'undefined') {
    return false;
  }

  return new URL(window.location.href).searchParams.get(
    RESUME_STUDIO_PREVIEW_QUERY_PARAM
  ) === '1';
}

export function getResumeStudioPreviewUrl() {
  if (typeof window === 'undefined') {
    return '/';
  }

  const url = new URL(window.location.href);

  url.searchParams.set(RESUME_STUDIO_PREVIEW_QUERY_PARAM, '1');

  return url.toString();
}

function toResumeStudioPreviewData(data: ResumeSourceData) {
  return redactResumeData(data);
}

function clampScrollProgress(progress: number) {
  if (!Number.isFinite(progress)) {
    return 0;
  }

  return Math.min(1, Math.max(0, progress));
}

function isScrollSyncProgressMessage(
  value: unknown,
  expectedType:
    | typeof RESUME_STUDIO_SCROLL_SYNC_SET_MESSAGE_TYPE
    | typeof RESUME_STUDIO_SCROLL_SYNC_UPDATE_MESSAGE_TYPE
): value is ResumeStudioScrollSyncProgressMessage & { type: typeof expectedType } {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return (
    'progress' in value &&
    typeof (value as { progress?: unknown }).progress === 'number' &&
    'type' in value &&
    (value as { type?: string }).type === expectedType
  );
}

export function createResumeStudioPreviewMessage(
  data: ResumeSourceData
): ResumeStudioPreviewMessage {
  return {
    data: toResumeStudioPreviewData(data),
    type: RESUME_STUDIO_PREVIEW_MESSAGE_TYPE,
  };
}

export function isResumeStudioPreviewMessage(
  value: unknown
): value is ResumeStudioPreviewMessage {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return (
    'type' in value &&
    (value as { type?: string }).type === RESUME_STUDIO_PREVIEW_MESSAGE_TYPE &&
    'data' in value
  );
}

export function createResumeStudioScrollSyncReadyMessage(): ResumeStudioScrollSyncReadyMessage {
  return {
    type: RESUME_STUDIO_SCROLL_SYNC_READY_MESSAGE_TYPE,
  };
}

export function createResumeStudioScrollSyncSetMessage(
  progress: number
): ResumeStudioScrollSyncSetMessage {
  return {
    progress: clampScrollProgress(progress),
    type: RESUME_STUDIO_SCROLL_SYNC_SET_MESSAGE_TYPE,
  };
}

export function createResumeStudioScrollSyncUpdateMessage(
  progress: number
): ResumeStudioScrollSyncUpdateMessage {
  return {
    progress: clampScrollProgress(progress),
    type: RESUME_STUDIO_SCROLL_SYNC_UPDATE_MESSAGE_TYPE,
  };
}

export function isResumeStudioScrollSyncReadyMessage(
  value: unknown
): value is ResumeStudioScrollSyncReadyMessage {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return (
    'type' in value &&
    (value as { type?: string }).type === RESUME_STUDIO_SCROLL_SYNC_READY_MESSAGE_TYPE
  );
}

export function isResumeStudioScrollSyncSetMessage(
  value: unknown
): value is ResumeStudioScrollSyncSetMessage {
  return isScrollSyncProgressMessage(value, RESUME_STUDIO_SCROLL_SYNC_SET_MESSAGE_TYPE);
}

export function isResumeStudioScrollSyncUpdateMessage(
  value: unknown
): value is ResumeStudioScrollSyncUpdateMessage {
  return isScrollSyncProgressMessage(value, RESUME_STUDIO_SCROLL_SYNC_UPDATE_MESSAGE_TYPE);
}

export function getResumeStudioMaxScrollTop(element: Pick<HTMLElement, 'clientHeight' | 'scrollHeight'>) {
  return Math.max(0, element.scrollHeight - element.clientHeight);
}

export function getResumeStudioScrollProgress(
  element: Pick<HTMLElement, 'clientHeight' | 'scrollHeight' | 'scrollTop'>
) {
  const maxScrollTop = getResumeStudioMaxScrollTop(element);

  if (maxScrollTop === 0) {
    return 0;
  }

  return clampScrollProgress(element.scrollTop / maxScrollTop);
}

export function getResumeStudioScrollTopForProgress(
  element: Pick<HTMLElement, 'clientHeight' | 'scrollHeight'>,
  progress: number
) {
  const maxScrollTop = getResumeStudioMaxScrollTop(element);

  if (maxScrollTop === 0) {
    return 0;
  }

  return clampScrollProgress(progress) * maxScrollTop;
}

export function setResumeStudioScrollProgress(
  element: HTMLElement,
  progress: number
) {
  const nextScrollTop = getResumeStudioScrollTopForProgress(element, progress);

  element.scrollTop = nextScrollTop;

  return nextScrollTop;
}

export function publishResumeStudioPreview(data: ResumeSourceData) {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(RESUME_STUDIO_PREVIEW_EVENT, {
      detail: toResumeStudioPreviewData(data),
    })
  );
}

export function getResumeStudioState() {
  return requestJson<ResumeStudioState>('/state');
}

export function initializeResumeStudio() {
  return requestJson<ResumeStudioState>('/init', {
    method: 'POST',
  });
}

export function saveResumeStudioDraft(payload: ResumeStudioDraftPayload) {
  return requestJsonWithPayload<ResumeStudioState>('/draft', 'PUT', payload);
}

export function createResumeStudioVersion(
  payload: ResumeStudioCreateVersionPayload
) {
  return requestJsonWithPayload<ResumeStudioState>('/versions', 'POST', payload);
}

export function publishResumeStudioVersion() {
  return requestJson<ResumeStudioState>('/publish', {
    method: 'POST',
  });
}

export function deleteResumeStudioVersion(versionId: number) {
  return requestJson<ResumeStudioState>(`/versions/${versionId}`, {
    method: 'DELETE',
  });
}

export function selectResumeStudioVersion(versionId: number) {
  return requestJson<ResumeStudioState>(`/versions/${versionId}/select`, {
    method: 'POST',
  });
}
