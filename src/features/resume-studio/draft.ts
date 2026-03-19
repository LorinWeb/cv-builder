import type {
  EducationItem,
  PrintConfig,
  ResumeSourceData,
  ResumeWorkEntry,
  ResumeWorkGroup,
  ResumeWorkItem,
  SkillCategory,
  TextValue,
} from '../../data/types/resume';
import { isResumeStudioProgressionGroupDraft } from './draft-factories';
import type {
  ResumeStudioDraft,
  ResumeStudioEducationDraft,
  ResumeStudioProgressionGroupDraft,
  ResumeStudioProgressionRoleDraft,
  ResumeStudioSkillDraft,
  ResumeStudioStandaloneWorkDraft,
  ResumeStudioTextDraft,
  ResumeStudioWorkDraft,
} from './types';

function pickPrintConfig(value: PrintConfig) {
  return {
    avoidPageBreakInside: value.avoidPageBreakInside,
    printBreakBefore: value.printBreakBefore,
  };
}

function getResumeStudioPhotoAlt(name: string | undefined) {
  const trimmedName = name?.trim() || '';

  return trimmedName.length > 0 ? `${trimmedName} photo` : undefined;
}

function toDraftString(value: string | null | undefined) {
  return value || '';
}

function toOptionalString(value: string) {
  return value || undefined;
}

function toTextDraft(value: TextValue): ResumeStudioTextDraft {
  if (typeof value === 'string') {
    return { text: value };
  }

  return {
    ...pickPrintConfig(value),
    text: value.text,
  };
}

function fromTextDraft(value: ResumeStudioTextDraft): TextValue {
  return {
    ...pickPrintConfig(value),
    text: value.text,
  };
}

function toTextDraftList(values: TextValue[] | undefined) {
  return (values || []).map(toTextDraft);
}

function toOptionalTextValueList(values: ResumeStudioTextDraft[]) {
  return values.length > 0 ? values.map(fromTextDraft) : undefined;
}

function toStandaloneWorkDraft(value: ResumeWorkEntry): ResumeStudioStandaloneWorkDraft {
  return {
    ...pickPrintConfig(value),
    company: value.company,
    endDate: toDraftString(value.endDate),
    highlights: toTextDraftList(value.highlights),
    isContract: Boolean(value.isContract),
    kind: 'role',
    position: value.position,
    startDate: value.startDate,
    summary: value.summary,
    website: toDraftString(value.website),
  };
}

function toProgressionRoleDraft(
  value: ResumeWorkEntry
): ResumeStudioProgressionRoleDraft {
  return {
    ...pickPrintConfig(value),
    company: value.company,
    endDate: toDraftString(value.endDate),
    highlights: toTextDraftList(value.highlights),
    isContract: Boolean(value.isContract),
    position: value.position,
    startDate: value.startDate,
    summary: value.summary,
  };
}

function toGroupedWorkDraft(
  value: ResumeWorkGroup
): ResumeStudioProgressionGroupDraft {
  return {
    ...pickPrintConfig(value),
    company: toDraftString(value.company),
    kind: 'group',
    progression: value.progression.map(toProgressionRoleDraft),
    website: toDraftString(value.website),
  };
}

function toWorkDraft(value: ResumeWorkItem): ResumeStudioWorkDraft {
  return 'progression' in value ? toGroupedWorkDraft(value) : toStandaloneWorkDraft(value);
}

function toSkillDraft(value: SkillCategory): ResumeStudioSkillDraft {
  return {
    ...pickPrintConfig(value),
    keywords: value.keywords.map(toTextDraft),
    name: value.name,
  };
}

function toEducationDraft(value: EducationItem): ResumeStudioEducationDraft {
  return {
    ...pickPrintConfig(value),
    area: value.area,
    courses: toTextDraftList(value.courses),
    endDate: toDraftString(value.endDate),
    gpa: toDraftString(value.gpa),
    institution: value.institution,
    startDate: value.startDate,
    studyType: value.studyType,
  };
}

export function toResumeStudioDraft(data: ResumeSourceData): ResumeStudioDraft {
  return {
    basics: {
      city: toDraftString(data.basics.location?.city),
      country: toDraftString(data.basics.location?.country),
      countryCode: toDraftString(data.basics.location?.countryCode),
      email: toDraftString(data.basics.email),
      label: data.basics.label,
      name: data.basics.name,
      phone: toDraftString(data.basics.phone),
      photoSrc: toDraftString(data.basics.photo?.src),
      profiles: (data.basics.profiles || []).map((profile) => ({
        network: toDraftString(profile.network),
        url: profile.url,
        username: toDraftString(profile.username),
      })),
      region: toDraftString(data.basics.location?.region),
      summary: data.basics.summary,
      summaryAlwaysFirstSection: Boolean(data.basics.summaryAlwaysFirstSection),
    },
    education: (data.education || []).map(toEducationDraft),
    impact: toTextDraftList(data.basics.impact),
    skills: (data.skills || []).map(toSkillDraft),
    work: (data.work || []).map(toWorkDraft),
  };
}

function applyBasics(source: ResumeSourceData, draft: ResumeStudioDraft): ResumeSourceData['basics'] {
  const nextLocation = {
    ...(source.basics.location || {}),
    city: toOptionalString(draft.basics.city),
    country: toOptionalString(draft.basics.country),
    countryCode: toOptionalString(draft.basics.countryCode),
    region: toOptionalString(draft.basics.region),
  };

  return {
    ...source.basics,
    email: toOptionalString(draft.basics.email),
    impact: draft.impact.map(fromTextDraft),
    label: draft.basics.label,
    location: Object.values(nextLocation).some(Boolean) ? nextLocation : undefined,
    name: draft.basics.name,
    phone: toOptionalString(draft.basics.phone),
    photo: draft.basics.photoSrc
      ? {
          alt: getResumeStudioPhotoAlt(draft.basics.name),
          src: draft.basics.photoSrc,
        }
      : undefined,
    profiles: draft.basics.profiles
      .filter((profile) => profile.url.trim().length > 0)
      .map((profile) => ({
        network: toOptionalString(profile.network),
        url: profile.url,
        username: toOptionalString(profile.username),
      })),
    summary: draft.basics.summary,
    summaryAlwaysFirstSection: draft.basics.summaryAlwaysFirstSection || undefined,
  };
}

function applySkills(skills: ResumeStudioSkillDraft[]): SkillCategory[] | undefined {
  if (skills.length === 0) {
    return undefined;
  }

  return skills.map((skill) => ({
    ...pickPrintConfig(skill),
    keywords: skill.keywords.map(fromTextDraft),
    name: skill.name,
  }));
}

function applyEducation(
  education: ResumeStudioEducationDraft[]
): EducationItem[] | undefined {
  if (education.length === 0) {
    return undefined;
  }

  return education.map((item) => ({
    ...pickPrintConfig(item),
    area: item.area,
    courses: toOptionalTextValueList(item.courses),
    endDate: toOptionalString(item.endDate),
    gpa: toOptionalString(item.gpa),
    institution: item.institution,
    startDate: item.startDate,
    studyType: item.studyType,
  }));
}

function applyProgressionGroup(item: ResumeStudioProgressionGroupDraft): ResumeWorkGroup {
  const groupCompany = item.company.trim();

  return {
    ...pickPrintConfig(item),
    company: groupCompany || undefined,
    progression: item.progression.map((entry) => ({
      ...pickPrintConfig(entry),
      company: groupCompany || entry.company,
      endDate: toOptionalString(entry.endDate),
      highlights: toOptionalTextValueList(entry.highlights),
      isContract: entry.isContract || undefined,
      position: entry.position,
      startDate: entry.startDate,
      summary: entry.summary,
    })),
    website: toOptionalString(item.website),
  };
}

function applyStandaloneWork(item: ResumeStudioStandaloneWorkDraft): ResumeWorkEntry {
  return {
    ...pickPrintConfig(item),
    company: item.company,
    endDate: toOptionalString(item.endDate),
    highlights: toOptionalTextValueList(item.highlights),
    isContract: item.isContract || undefined,
    position: item.position,
    startDate: item.startDate,
    summary: item.summary,
    website: toOptionalString(item.website),
  };
}

function applyWork(draft: ResumeStudioDraft): ResumeSourceData['work'] {
  if (draft.work.length === 0) {
    return undefined;
  }

  return draft.work.map((item) =>
    isResumeStudioProgressionGroupDraft(item)
      ? applyProgressionGroup(item)
      : applyStandaloneWork(item)
  );
}

export function applyResumeStudioDraft(
  source: ResumeSourceData,
  draft: ResumeStudioDraft
): ResumeSourceData {
  return {
    ...source,
    basics: applyBasics(source, draft),
    education: applyEducation(draft.education),
    skills: applySkills(draft.skills),
    work: applyWork(draft),
  };
}
