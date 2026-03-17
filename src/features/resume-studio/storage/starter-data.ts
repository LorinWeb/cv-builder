import type { ResumeSourceData } from '../../../data/types/resume';

export function createResumeStudioStarterData(): ResumeSourceData {
  return {
    basics: {
      label: 'Your next role title',
      name: 'Your Name',
      summary:
        'Write a concise summary that explains your strengths, your focus area, and the kind of work you want next.',
    },
    education: [],
    skills: [],
    work: [],
  };
}
