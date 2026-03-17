import type {
  ResumeStudioEducationDraft,
  ResumeStudioProfileDraft,
  ResumeStudioProgressionGroupDraft,
  ResumeStudioProgressionRoleDraft,
  ResumeStudioSkillDraft,
  ResumeStudioStandaloneWorkDraft,
  ResumeStudioTextDraft,
  ResumeStudioWorkDraft,
} from './types';

export function createEmptyResumeStudioTextDraft(): ResumeStudioTextDraft {
  return { text: '' };
}

export function createEmptyResumeStudioProfileDraft(): ResumeStudioProfileDraft {
  return {
    network: '',
    url: '',
    username: '',
  };
}

export function createEmptyResumeStudioSkillDraft(): ResumeStudioSkillDraft {
  return {
    keywords: [],
    name: '',
  };
}

export function createEmptyResumeStudioEducationDraft(): ResumeStudioEducationDraft {
  return {
    area: '',
    courses: [],
    endDate: '',
    gpa: '',
    institution: '',
    startDate: '',
    studyType: '',
  };
}

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
