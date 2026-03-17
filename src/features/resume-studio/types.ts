import type { PrintConfig, ResumeSourceData } from '../../data/types/resume';

export type ResumeStudioSource = 'private' | 'sample';
export type ResumeStudioStepId = 'basics' | 'contacts' | 'achievements' | 'experience' | 'skills' | 'education';
export type ResumeStudioWarningCode = 'unsupported-work-progression';

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

export interface ResumeStudioWorkDraft extends PrintConfig {
  company: string;
  endDate: string;
  highlights: ResumeStudioTextDraft[];
  isContract: boolean;
  position: string;
  startDate: string;
  summary: string;
  website: string;
}

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
  name: string;
  updatedAt: string;
}

export interface ResumeStudioState {
  activeVersionId: number | null;
  activeVersionName: string | null;
  canEdit: boolean;
  draft: ResumeSourceData | null;
  draftUpdatedAt: string | null;
  isInitialized: boolean;
  isWizardCompatible: boolean;
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
