import type {
  ResumeStudioProgressionGroupDraft,
  ResumeStudioProgressionRoleDraft,
  ResumeStudioStandaloneWorkDraft,
  ResumeStudioWorkDraft,
} from './types';

export function createEmptyResumeStudioStandaloneWorkDraft(): ResumeStudioStandaloneWorkDraft {
  return {
    company: '',
    endDate: '',
    highlights: [],
    isContract: false,
    kind: 'role',
    position: '',
    startDate: '',
    summary: '',
    website: '',
  };
}

export function createEmptyResumeStudioProgressionRoleDraft(
  company = ''
): ResumeStudioProgressionRoleDraft {
  return {
    company,
    endDate: '',
    highlights: [],
    isContract: false,
    position: '',
    startDate: '',
    summary: '',
  };
}

export function createEmptyResumeStudioProgressionGroupDraft(): ResumeStudioProgressionGroupDraft {
  return {
    company: '',
    kind: 'group',
    progression: [createEmptyResumeStudioProgressionRoleDraft()],
    website: '',
  };
}

export function isResumeStudioProgressionGroupDraft(
  value: ResumeStudioWorkDraft
): value is ResumeStudioProgressionGroupDraft {
  return value.kind === 'group';
}
