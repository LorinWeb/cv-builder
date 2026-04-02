import type {
  EducationItem,
  ResumeMode,
  ResumeRuntimeData,
  ResumeSourceData,
  ResumeWorkEntry,
  ResumeWorkItem,
  SkillCategory,
  TextValue,
} from '../data/types/resume';
import { formatDateRange } from './date-range';
import { stripMarkdownToPlainText } from './markdown';
import { getTextValueSource } from './text-value';

const MANUAL_MARKDOWN_BLOCK_SEPARATOR = '\n\n---\n\n';

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeMarkdown(value: string) {
  return value.replace(/\r\n?/g, '\n').trim();
}

function getMarkdownBlocks(markdown: string) {
  return normalizeMarkdown(markdown)
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
}

function isIgnorableDescriptionBlock(block: string) {
  const lines = block
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return true;
  }

  if (/^#\s+/.test(lines[0])) {
    return true;
  }

  return lines.every((line) => /^#{1,6}\s/.test(line) || /^[-*_]{3,}$/.test(line));
}

function formatCountry(value: ResumeSourceData['basics']['location']) {
  if (!value) {
    return '';
  }

  return value.country || value.countryCode || '';
}

function formatLocationLine(data: ResumeSourceData) {
  return [data.basics.location?.city, formatCountry(data.basics.location)]
    .filter(Boolean)
    .join(', ');
}

function formatContactLine(data: ResumeSourceData) {
  const contactValues = [
    data.basics.email,
    data.basics.phone,
    ...(data.basics.profiles || []).map((profile) => profile.url),
  ];

  return contactValues.filter(Boolean).join(' | ');
}

function flattenWorkItems(work: ResumeWorkItem[] | undefined): ResumeWorkEntry[] {
  if (!work) {
    return [];
  }

  return work.flatMap((item) =>
    'progression' in item
      ? item.progression.map((entry) => ({
          ...entry,
          company: entry.company || item.company || '',
          website: entry.website || item.website,
        }))
      : item
  );
}

function toMarkdownList(values: TextValue[] | undefined) {
  const items = (values || [])
    .map(getTextValueSource)
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => `- ${value}`);

  return items.length > 0 ? items.join('\n') : '';
}

function createSection(title: string, body: string) {
  const trimmedBody = body.trim();

  if (!trimmedBody) {
    return '';
  }

  return [`## ${title}`, trimmedBody].join('\n\n');
}

function createWorkSection(data: ResumeSourceData) {
  const entries = flattenWorkItems(data.work);

  if (entries.length === 0) {
    return '';
  }

  const body = entries
    .map((entry) => {
      const title = entry.company
        ? `### ${entry.position} - ${entry.company}`
        : `### ${entry.position}`;
      const summary = entry.summary.trim();
      const highlights = toMarkdownList(entry.highlights);

      return [title, `*${formatDateRange(entry.startDate, entry.endDate)}*`, summary, highlights]
        .filter(Boolean)
        .join('\n\n');
    })
    .join('\n\n');

  return createSection('Experience', body);
}

function createSkillsSection(skills: SkillCategory[] | undefined) {
  if (!skills || skills.length === 0) {
    return '';
  }

  const body = skills
    .map((skill) => {
      const keywords = toMarkdownList(skill.keywords);

      return [`### ${skill.name}`, keywords].filter(Boolean).join('\n\n');
    })
    .join('\n\n');

  return createSection('Skills', body);
}

function createEducationSection(education: EducationItem[] | undefined) {
  if (!education || education.length === 0) {
    return '';
  }

  const body = education
    .map((item) => {
      const title = `### ${item.studyType} in ${item.area}`;
      const courses = toMarkdownList(item.courses);

      return [
        title,
        `*${formatDateRange(item.startDate, item.endDate)}*`,
        item.institution.trim(),
        courses,
      ]
        .filter(Boolean)
        .join('\n\n');
    })
    .join('\n\n');

  return createSection('Education', body);
}

export function getResumeMode(data?: Pick<ResumeRuntimeData, 'mode'> | null): ResumeMode {
  return data?.mode === 'manual' ? 'manual' : 'structured';
}

export function getManualResumeTitleText(markdown: string) {
  const normalizedMarkdown = normalizeMarkdown(markdown);

  for (const line of normalizedMarkdown.split('\n')) {
    const trimmedLine = line.trim();

    if (!/^#\s+/.test(trimmedLine)) {
      continue;
    }

    const title = normalizeWhitespace(stripMarkdownToPlainText(trimmedLine.replace(/^#\s+/, '')));

    return title || null;
  }

  return null;
}

export function getManualResumeDescriptionText(markdown: string) {
  for (const block of getMarkdownBlocks(markdown)) {
    if (isIgnorableDescriptionBlock(block)) {
      continue;
    }

    const description = normalizeWhitespace(
      stripMarkdownToPlainText(
        block
          .split('\n')
          .filter((line) => !/^#{1,6}\s/.test(line.trim()) && !/^[-*_]{3,}$/.test(line.trim()))
          .join('\n')
      )
    );

    if (description) {
      return description;
    }
  }

  return null;
}

export function createManualResumeMarkdown(data: ResumeSourceData) {
  const headerLines = [
    `# ${data.basics.name}`,
    data.basics.label ? `**${data.basics.label}**` : '',
    formatLocationLine(data),
    formatContactLine(data),
  ].filter(Boolean);
  const sections = [
    data.basics.summary.trim()
      ? createSection('Summary', data.basics.summary.trim())
      : '',
    data.basics.impact?.length ? createSection('Selected Achievements', toMarkdownList(data.basics.impact)) : '',
    createWorkSection(data),
    createSkillsSection(data.skills),
    createEducationSection(data.education),
  ].filter(Boolean);

  return [headerLines.join('\n'), ...sections].filter(Boolean).join(MANUAL_MARKDOWN_BLOCK_SEPARATOR);
}
