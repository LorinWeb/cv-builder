import type { PrintConfig, ResumeSourceData } from '../../data/types/resume';

export type ResumeStudioStepId = 'basics' | 'contacts' | 'achievements' | 'experience' | 'skills' | 'education';
type ResumeStudioSource = 'private' | 'sample';
type ResumeStudioWarningCode = string;

export interface ResumeStudioTextDraft extends PrintConfig {
  text: string;
}

export interface ResumeStudioProfileDraft {
  network: string;
  url: string;
  username: string;
}

export interface ResumeStudioBasicsDraft {
  country: string;
  countryCode: string;
  email: string;
  label: string;
  name: string;
  phone: string;
  photoSrc: string;
  profiles: ResumeStudioProfileDraft[];
  region: string;
  summary: string;
  city: string;
}

export interface ResumeStudioStandaloneWorkDraft extends PrintConfig {
  kind: 'role';
  company: string;
  endDate: string;
  highlights: ResumeStudioTextDraft[];
  isContract: boolean;
  position: string;
  startDate: string;
  summary: string;
  website: string;
}

export interface ResumeStudioProgressionRoleDraft extends PrintConfig {
  company: string;
  endDate: string;
  highlights: ResumeStudioTextDraft[];
  isContract: boolean;
  position: string;
  startDate: string;
  summary: string;
}

export interface ResumeStudioProgressionGroupDraft extends PrintConfig {
  company: string;
  kind: 'group';
  progression: ResumeStudioProgressionRoleDraft[];
  website: string;
}

export type ResumeStudioWorkDraft =
  | ResumeStudioStandaloneWorkDraft
  | ResumeStudioProgressionGroupDraft;

export interface ResumeStudioSkillDraft extends PrintConfig {
  keywords: ResumeStudioTextDraft[];
  name: string;
}

export interface ResumeStudioEducationDraft extends PrintConfig {
  area: string;
  courses: ResumeStudioTextDraft[];
  endDate: string;
  gpa: string;
  institution: string;
  startDate: string;
  studyType: string;
}

export interface ResumeStudioDraft {
  basics: ResumeStudioBasicsDraft;
  education: ResumeStudioEducationDraft[];
  impact: ResumeStudioTextDraft[];
  skills: ResumeStudioSkillDraft[];
  work: ResumeStudioWorkDraft[];
}

export interface ResumeStudioWarning {
  code: ResumeStudioWarningCode;
  message: string;
  step: ResumeStudioStepId;
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
  canEdit: boolean;
  draft: ResumeSourceData | null;
  draftUpdatedAt: string | null;
  hasUnpublishedChanges: boolean;
  isActiveVersionPublished: boolean;
  isInitialized: boolean;
  isWizardCompatible: boolean;
  publishedDraft: ResumeSourceData | null;
  publishedVersionId: number | null;
  publishedVersionName: string | null;
  source: ResumeStudioSource;
  versions: ResumeVersionSummary[];
  warnings: ResumeStudioWarning[];
}

export interface ResumeStudioDraftPayload {
  draft: ResumeSourceData;
}

export interface ResumeStudioCreateVersionPayload {
  name: string;
}

export interface ResumeStudioPhotoUploadPayload {
  bytesBase64: string;
  fileName: string;
}

export interface ResumeStudioPhotoUploadResult {
  src: string;
}

export interface ResumeStudioApiErrorPayload {
  error: string;
  fieldErrors?: Record<string, string>;
}
