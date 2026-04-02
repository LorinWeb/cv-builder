import type { ResumeSourceData } from '../../data/types/resume';

export interface ResumeStudioDraft {
  markdown: string;
}

export interface ResumeVersionSummary {
  createdAt: string;
  id: number;
  isActive: boolean;
  isPublished: boolean;
  name: string;
  updatedAt: string;
}

export interface ResumeStudioState {
  activeVersionId: number | null;
  activeVersionName: string | null;
  draft: ResumeSourceData | null;
  draftUpdatedAt: string | null;
  hasUnpublishedChanges: boolean;
  isActiveVersionPublished: boolean;
  isInitialized: boolean;
  publishedDraft: ResumeSourceData | null;
  publishedVersionId: number | null;
  versions: ResumeVersionSummary[];
}

export interface ResumeStudioDraftPayload {
  draft: ResumeSourceData;
}

export interface ResumeStudioCreateVersionPayload {
  name: string;
}

export interface ResumeStudioApiErrorPayload {
  error: string;
  fieldErrors?: Record<string, string>;
}
