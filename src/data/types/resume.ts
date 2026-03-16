export interface PrintConfig {
  avoidPageBreakInside?: boolean;
  printBreakBefore?: 'page';
}

export interface TextEntry extends PrintConfig {
  text: string;
}

export type TextValue = string | TextEntry;

export interface ResumeLocation {
  address?: string;
  city?: string;
  country?: string;
  countryCode?: string;
  postalCode?: string;
  region?: string;
}

export interface ResumeProfile {
  network?: string;
  url: string;
  username?: string;
}

export interface ResumePhoto {
  alt?: string;
  src: string;
}

export interface ResumeBasics {
  impact?: TextValue[];
  label: string;
  location?: ResumeLocation;
  name: string;
  photo?: ResumePhoto;
  profiles?: ResumeProfile[];
  summary: string;
}

export interface ResumeSourceBasics extends ResumeBasics {
  email?: string;
  phone?: string;
}

export interface ResumeWorkEntry extends PrintConfig {
  company: string;
  endDate?: string;
  highlights?: TextValue[];
  isContract?: boolean;
  position: string;
  startDate: string;
  summary: string;
  website?: string;
}

export interface ResumeWorkGroup extends PrintConfig {
  company?: string;
  progression: ResumeWorkEntry[];
  website?: string;
}

export type ResumeWorkItem = ResumeWorkEntry | ResumeWorkGroup;

export interface SkillCategory extends PrintConfig {
  keywords: TextValue[];
  name: string;
}

export interface EducationItem extends PrintConfig {
  area: string;
  courses?: TextValue[];
  endDate?: string;
  gpa?: string;
  institution: string;
  startDate: string;
  studyType: string;
}

export interface EducationNote extends PrintConfig {
  summary: string;
  title: string;
}

export interface ResumeVolunteerItem extends PrintConfig {
  endDate?: string;
  highlights?: TextValue[];
  organization: string;
  position?: string;
  startDate?: string;
  summary?: string;
  url?: string;
}

export interface ResumeAward extends PrintConfig {
  awarder?: string;
  date?: string;
  summary?: string;
  title: string;
}

export interface ResumePublication extends PrintConfig {
  name: string;
  publisher?: string;
  releaseDate?: string;
  summary?: string;
  url?: string;
}

export interface ResumeInterest extends PrintConfig {
  keywords?: string[];
  name: string;
}

export interface ResumeReference extends PrintConfig {
  name: string;
  reference?: string;
}

export interface ResumeLanguage extends PrintConfig {
  level?: string;
  name: string;
}

interface ResumeSections {
  awards?: ResumeAward[];
  education?: EducationItem[];
  educationNote?: EducationNote;
  interests?: ResumeInterest[];
  languages?: ResumeLanguage[];
  publications?: ResumePublication[];
  references?: ResumeReference[];
  skills?: SkillCategory[];
  volunteer?: ResumeVolunteerItem[];
  work?: ResumeWorkItem[];
}

export interface ResumeData extends ResumeSections {
  basics: ResumeBasics;
}

export interface ResumeSourceData extends ResumeSections {
  basics: ResumeSourceBasics;
}

export type ResumeRuntimeData = ResumeData | ResumeSourceData;
