import type {
  EducationItem,
  ResumeSourceData,
  ResumeWorkEntry,
  SkillCategory,
  TextValue,
} from '../../data/types/resume';
import { isResumeStudioWorkEditable } from './compatibility';
import type {
  ResumeStudioDraft,
  ResumeStudioEducationDraft,
  ResumeStudioSkillDraft,
  ResumeStudioTextDraft,
  ResumeStudioWorkDraft,
} from './types';

function getResumeStudioPhotoAlt(name: string | undefined) {
  const trimmedName = name?.trim() || '';

  return trimmedName.length > 0 ? `${trimmedName} photo` : undefined;
}

function toTextDraft(value: TextValue): ResumeStudioTextDraft {
  if (typeof value === 'string') {
    return { text: value };
  }

  return {
    avoidPageBreakInside: value.avoidPageBreakInside,
    printBreakBefore: value.printBreakBefore,
    text: value.text,
  };
}

function fromTextDraft(value: ResumeStudioTextDraft): TextValue {
  return {
    avoidPageBreakInside: value.avoidPageBreakInside,
    printBreakBefore: value.printBreakBefore,
    text: value.text,
  };
}

function toWorkDraft(value: ResumeWorkEntry): ResumeStudioWorkDraft {
  return {
    avoidPageBreakInside: value.avoidPageBreakInside,
    company: value.company,
    endDate: value.endDate || '',
    highlights: (value.highlights || []).map(toTextDraft),
    isContract: Boolean(value.isContract),
    position: value.position,
    printBreakBefore: value.printBreakBefore,
    startDate: value.startDate,
    summary: value.summary,
    website: value.website || '',
  };
}

function toSkillDraft(value: SkillCategory): ResumeStudioSkillDraft {
  return {
    avoidPageBreakInside: value.avoidPageBreakInside,
    keywords: value.keywords.map(toTextDraft),
    name: value.name,
    printBreakBefore: value.printBreakBefore,
  };
}

function toEducationDraft(value: EducationItem): ResumeStudioEducationDraft {
  return {
    area: value.area,
    avoidPageBreakInside: value.avoidPageBreakInside,
    courses: (value.courses || []).map(toTextDraft),
    endDate: value.endDate || '',
    gpa: value.gpa || '',
    institution: value.institution,
    printBreakBefore: value.printBreakBefore,
    startDate: value.startDate,
    studyType: value.studyType,
  };
}

export function toResumeStudioDraft(data: ResumeSourceData): ResumeStudioDraft {
  return {
    basics: {
      city: data.basics.location?.city || '',
      country: data.basics.location?.country || '',
      countryCode: data.basics.location?.countryCode || '',
      email: data.basics.email || '',
      label: data.basics.label,
      name: data.basics.name,
      phone: data.basics.phone || '',
      photoSrc: data.basics.photo?.src || '',
      profiles: (data.basics.profiles || []).map((profile) => ({
        network: profile.network || '',
        url: profile.url,
        username: profile.username || '',
      })),
      region: data.basics.location?.region || '',
      summary: data.basics.summary,
    },
    education: (data.education || []).map(toEducationDraft),
    impact: (data.basics.impact || []).map(toTextDraft),
    skills: (data.skills || []).map(toSkillDraft),
    work: isResumeStudioWorkEditable(data)
      ? (data.work || [])
          .filter((item): item is ResumeWorkEntry => !('progression' in item))
          .map(toWorkDraft)
      : [],
  };
}

function applyBasics(source: ResumeSourceData, draft: ResumeStudioDraft): ResumeSourceData['basics'] {
  const currentLocation = source.basics.location || {};
  const nextLocation = {
    ...currentLocation,
    city: draft.basics.city || undefined,
    country: draft.basics.country || undefined,
    countryCode: draft.basics.countryCode || undefined,
    region: draft.basics.region || undefined,
  };

  const basics = {
    ...source.basics,
    email: draft.basics.email || undefined,
    impact: draft.impact.map(fromTextDraft),
    label: draft.basics.label,
    location: Object.values(nextLocation).some(Boolean) ? nextLocation : undefined,
    name: draft.basics.name,
    phone: draft.basics.phone || undefined,
    profiles: draft.basics.profiles
      .filter((profile) => profile.url.trim().length > 0)
      .map((profile) => ({
        network: profile.network || undefined,
        url: profile.url,
        username: profile.username || undefined,
      })),
    summary: draft.basics.summary,
  };

  return {
    ...basics,
    photo: draft.basics.photoSrc
      ? {
          alt: getResumeStudioPhotoAlt(draft.basics.name),
          src: draft.basics.photoSrc,
        }
      : undefined,
  };
}

function applySkills(skills: ResumeStudioSkillDraft[]): SkillCategory[] | undefined {
  if (skills.length === 0) {
    return undefined;
  }

  return skills.map((skill) => ({
    avoidPageBreakInside: skill.avoidPageBreakInside,
    keywords: skill.keywords.map(fromTextDraft),
    name: skill.name,
    printBreakBefore: skill.printBreakBefore,
  }));
}

function applyEducation(
  education: ResumeStudioEducationDraft[]
): EducationItem[] | undefined {
  if (education.length === 0) {
    return undefined;
  }

  return education.map((item) => ({
    area: item.area,
    avoidPageBreakInside: item.avoidPageBreakInside,
    courses: item.courses.length > 0 ? item.courses.map(fromTextDraft) : undefined,
    endDate: item.endDate || undefined,
    gpa: item.gpa || undefined,
    institution: item.institution,
    printBreakBefore: item.printBreakBefore,
    startDate: item.startDate,
    studyType: item.studyType,
  }));
}

function applyWork(
  source: ResumeSourceData,
  draft: ResumeStudioDraft
): ResumeSourceData['work'] {
  if (!isResumeStudioWorkEditable(source)) {
    return source.work;
  }

  if (draft.work.length === 0) {
    return undefined;
  }

  return draft.work.map((item) => ({
    avoidPageBreakInside: item.avoidPageBreakInside,
    company: item.company,
    endDate: item.endDate || undefined,
    highlights: item.highlights.length > 0 ? item.highlights.map(fromTextDraft) : undefined,
    isContract: item.isContract || undefined,
    position: item.position,
    printBreakBefore: item.printBreakBefore,
    startDate: item.startDate,
    summary: item.summary,
    website: item.website || undefined,
  }));
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
    work: applyWork(source, draft),
  };
}
