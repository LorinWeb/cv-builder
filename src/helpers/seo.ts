import type { ResumeRuntimeData } from '../data/types/resume';
import {
  getManualResumeDescriptionText,
  getManualResumeTitleText,
  getResumeMode,
} from './manual-resume';
import { stripMarkdownToPlainText } from './markdown';

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function getDocumentTitle(
  resumeData: ResumeRuntimeData
): string {
  if (getResumeMode(resumeData) === 'manual') {
    const title = getManualResumeTitleText(resumeData.manual?.markdown || '');

    return title ? `${title} CV` : 'Resume';
  }

  const rawName = resumeData.basics?.name;

  if (typeof rawName !== 'string') {
    throw new Error('Cannot generate document title: resume basics.name must be a string.');
  }

  const name = normalizeWhitespace(rawName);

  if (!name) {
    throw new Error('Cannot generate document title: resume basics.name must not be empty.');
  }

  return `${name} CV`;
}

export function getMetaDescription(
  resumeData: ResumeRuntimeData
): string {
  if (getResumeMode(resumeData) === 'manual') {
    const summary = getManualResumeDescriptionText(resumeData.manual?.markdown || '');

    if (!summary) {
      throw new Error(
        'Cannot generate meta description: manual resume markdown must include visible text.'
      );
    }

    const firstSentence = summary.match(/^[^.]*\./)?.[0];

    return firstSentence ? firstSentence.trim() : summary;
  }

  const rawSummary = resumeData.basics?.summary;

  if (typeof rawSummary !== 'string') {
    throw new Error(
      'Cannot generate meta description: resume basics.summary must be a string.'
    );
  }

  const summary = normalizeWhitespace(stripMarkdownToPlainText(rawSummary));

  if (!summary) {
    throw new Error(
      'Cannot generate meta description: resume basics.summary must not be empty.'
    );
  }

  const firstSentence = summary.match(/^[^.]*\./)?.[0];

  return firstSentence ? firstSentence.trim() : summary;
}
