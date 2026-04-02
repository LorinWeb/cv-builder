import type { ResumeSourceData } from '../../data/types/resume';
import type { ResumeStudioDraft } from './types';

export function normalizeResumeStudioMarkdown(markdown: string) {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  let fencedCodeDelimiter: '```' | '~~~' | null = null;

  return lines
    .map((line) => {
      const trimmedLine = line.trimStart();
      const fenceMatch = /^(?<delimiter>`{3,}|~{3,})/.exec(trimmedLine);

      if (fenceMatch) {
        const delimiter = fenceMatch.groups?.delimiter?.startsWith('~') ? '~~~' : '```';

        fencedCodeDelimiter =
          fencedCodeDelimiter === delimiter ? null : fencedCodeDelimiter || delimiter;

        return line;
      }

      if (fencedCodeDelimiter) {
        return line;
      }

      return line.replace(/ {2,}$/, '\\');
    })
    .join('\n');
}

export function getResumeStudioDraftFieldErrors(data: unknown) {
  const markdown =
    data && typeof data === 'object' && 'markdown' in data
      ? (data as { markdown?: unknown }).markdown
      : undefined;

  if (typeof markdown !== 'string' || markdown.trim().length === 0) {
    return {
      markdown: 'Resume markdown is required.',
    };
  }

  return null;
}

export function toResumeStudioDraft(data: ResumeSourceData): ResumeStudioDraft {
  return {
    markdown: normalizeResumeStudioMarkdown(data.markdown),
  };
}

export function applyResumeStudioDraft(draft: ResumeStudioDraft): ResumeSourceData {
  return {
    markdown: normalizeResumeStudioMarkdown(draft.markdown),
  };
}
