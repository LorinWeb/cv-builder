import type { ResumeSourceData } from '../../data/types/resume';
import { redactResumeData } from '../pdf-download/build';
import {
  RESUME_STUDIO_API_ROOT,
  RESUME_STUDIO_PREVIEW_MESSAGE_TYPE,
  RESUME_STUDIO_PREVIEW_QUERY_PARAM,
} from './constants';
import type {
  ResumeStudioApiErrorPayload,
  ResumeStudioCreateVersionPayload,
  ResumeStudioDraftPayload,
  ResumeStudioPhotoUploadPayload,
  ResumeStudioPhotoUploadResult,
  ResumeStudioState,
} from './types';

export const RESUME_STUDIO_PREVIEW_EVENT = 'resume-studio:preview-data';

export interface ResumeStudioPreviewMessage {
  data: ReturnType<typeof redactResumeData>;
  type: typeof RESUME_STUDIO_PREVIEW_MESSAGE_TYPE;
}

export class ResumeStudioApiError extends Error {
  fieldErrors?: Record<string, string>;

  constructor(message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.fieldErrors = fieldErrors;
  }
}

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

export function toResumeStudioPreviewData(data: ResumeSourceData) {
  return redactResumeData(data);
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
  return requestJson<ResumeStudioState>('/draft', {
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'PUT',
  });
}

export function createResumeStudioVersion(
  payload: ResumeStudioCreateVersionPayload
) {
  return requestJson<ResumeStudioState>('/versions', {
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
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

export function uploadResumeStudioPhoto(
  payload: ResumeStudioPhotoUploadPayload
) {
  return requestJson<ResumeStudioPhotoUploadResult>('/upload-photo', {
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });
}
