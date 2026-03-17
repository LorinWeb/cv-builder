import type { ResumeSourceData } from '../../data/types/resume';
import type { ResumeStudioWarning } from './types';

export function getResumeStudioWarnings(data: ResumeSourceData): ResumeStudioWarning[] {
  const warnings: ResumeStudioWarning[] = [];

  if (data.work?.some((item) => 'progression' in item)) {
    warnings.push({
      code: 'unsupported-work-progression',
      message:
        'Grouped work progression entries are preserved, but the experience step stays read-only until those entries are flattened.',
      step: 'experience',
    });
  }

  return warnings;
}

export function isResumeStudioWorkEditable(data: ResumeSourceData) {
  return !data.work?.some((item) => 'progression' in item);
}
