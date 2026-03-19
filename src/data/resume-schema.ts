import { z } from 'zod';

import type { ResumeSourceData } from './types/resume';

const printConfigSchema = z.object({
  avoidPageBreakInside: z.boolean().optional(),
  printBreakBefore: z.literal('page').optional(),
});

const textEntrySchema = printConfigSchema.extend({
  text: z.string(),
});

const textValueSchema = z.union([z.string(), textEntrySchema]);

const resumeLocationSchema = z.object({
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  countryCode: z.string().optional(),
  postalCode: z.string().optional(),
  region: z.string().optional(),
});

const resumeProfileSchema = z.object({
  network: z.string().optional(),
  url: z.string(),
  username: z.string().optional(),
});

const resumePhotoSchema = z.object({
  alt: z.string().optional(),
  src: z.string(),
});

const resumeBasicsSchema = z.object({
  email: z.string().optional(),
  impact: z.array(textValueSchema).optional(),
  label: z.string(),
  location: resumeLocationSchema.optional(),
  name: z.string(),
  phone: z.string().optional(),
  photo: resumePhotoSchema.optional(),
  profiles: z.array(resumeProfileSchema).optional(),
  summary: z.string(),
  summaryAlwaysFirstSection: z.boolean().optional(),
});

const resumeWorkEntrySchema = printConfigSchema.extend({
  company: z.string(),
  endDate: z.string().optional(),
  highlights: z.array(textValueSchema).optional(),
  isContract: z.boolean().optional(),
  position: z.string(),
  startDate: z.string(),
  summary: z.string(),
  website: z.string().optional(),
});

const resumeWorkGroupSchema = printConfigSchema.extend({
  company: z.string().optional(),
  progression: z.array(resumeWorkEntrySchema),
  website: z.string().optional(),
});

const resumeWorkItemSchema = z.union([resumeWorkGroupSchema, resumeWorkEntrySchema]);

const skillCategorySchema = printConfigSchema.extend({
  keywords: z.array(textValueSchema),
  name: z.string(),
});

const educationItemSchema = printConfigSchema.extend({
  area: z.string(),
  courses: z.array(textValueSchema).optional(),
  endDate: z.string().optional(),
  gpa: z.string().optional(),
  institution: z.string(),
  startDate: z.string(),
  studyType: z.string(),
});

const resumeVolunteerItemSchema = printConfigSchema.extend({
  endDate: z.string().optional(),
  highlights: z.array(textValueSchema).optional(),
  organization: z.string(),
  position: z.string().optional(),
  startDate: z.string().optional(),
  summary: z.string().optional(),
  url: z.string().optional(),
});

const resumeAwardSchema = printConfigSchema.extend({
  awarder: z.string().optional(),
  date: z.string().optional(),
  summary: z.string().optional(),
  title: z.string(),
});

const resumePublicationSchema = printConfigSchema.extend({
  name: z.string(),
  publisher: z.string().optional(),
  releaseDate: z.string().optional(),
  summary: z.string().optional(),
  url: z.string().optional(),
});

const resumeInterestSchema = printConfigSchema.extend({
  keywords: z.array(z.string()).optional(),
  name: z.string(),
});

const resumeReferenceSchema = printConfigSchema.extend({
  name: z.string(),
  reference: z.string().optional(),
});

const resumeLanguageSchema = printConfigSchema.extend({
  level: z.string().optional(),
  name: z.string(),
});

export const resumeDataSchema = z.object({
  awards: z.array(resumeAwardSchema).optional(),
  basics: resumeBasicsSchema,
  education: z.array(educationItemSchema).optional(),
  interests: z.array(resumeInterestSchema).optional(),
  languages: z.array(resumeLanguageSchema).optional(),
  publications: z.array(resumePublicationSchema).optional(),
  references: z.array(resumeReferenceSchema).optional(),
  skills: z.array(skillCategorySchema).optional(),
  volunteer: z.array(resumeVolunteerItemSchema).optional(),
  work: z.array(resumeWorkItemSchema).optional(),
});

export function parseResumeData(value: unknown): ResumeSourceData {
  const result = resumeDataSchema.safeParse(value);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => {
        const path = issue.path.length > 0 ? issue.path.join('.') : 'root';

        return `${path}: ${issue.message}`;
      })
      .join('; ');

    throw new Error(`Resume data validation failed: ${issues}`);
  }

  const parsed: ResumeSourceData = result.data;

  return parsed;
}
