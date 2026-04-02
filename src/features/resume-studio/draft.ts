import type { ResumeSourceData } from '../../data/types/resume';
import { createManualResumeMarkdown } from '../../helpers/manual-resume';
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

export function toResumeStudioDraft(data: ResumeSourceData): ResumeStudioDraft {
  return {
    markdown:
      data.mode === 'manual' && data.manual?.markdown
        ? normalizeResumeStudioMarkdown(data.manual.markdown)
        : normalizeResumeStudioMarkdown(createManualResumeMarkdown(data)),
  };
}

export function applyResumeStudioDraft(
  source: ResumeSourceData,
  draft: ResumeStudioDraft
): ResumeSourceData {
  return {
    ...source,
    manual: {
      markdown: normalizeResumeStudioMarkdown(draft.markdown),
    },
    mode: 'manual',
  };
}
