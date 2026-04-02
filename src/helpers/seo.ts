import type { ResumeRuntimeData } from '../data/types/resume';
import { stripMarkdownToPlainText } from './markdown';

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeMarkdown(markdown: string) {
  return markdown.replace(/\r\n?/g, '\n').trim();
}

function getMarkdownBlocks(markdown: string) {
  return normalizeMarkdown(markdown)
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
}

function getMarkdownTitle(markdown: string) {
  for (const line of normalizeMarkdown(markdown).split('\n')) {
    const trimmedLine = line.trim();

    if (!/^#\s+/.test(trimmedLine)) {
      continue;
    }

    const title = normalizeWhitespace(stripMarkdownToPlainText(trimmedLine.replace(/^#\s+/, '')));

    if (title) {
      return title;
    }
  }

  return null;
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

function getMarkdownDescription(markdown: string) {
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

export function getDocumentTitle(resumeData: ResumeRuntimeData): string {
  const title = getMarkdownTitle(resumeData.markdown);

  return title ? `${title} CV` : 'Resume';
}

export function getMetaDescription(resumeData: ResumeRuntimeData): string {
  const summary = getMarkdownDescription(resumeData.markdown);

  if (!summary) {
    throw new Error(
      'Cannot generate meta description: resume markdown must include visible text.'
    );
  }

  const firstSentence = summary.match(/^[^.]*\./)?.[0];

  return firstSentence ? firstSentence.trim() : summary;
}
