import type { ResumeData, ResumeSourceData } from '../../../data/types/resume';
import type { PdfRenderTarget } from '../types';

export function getResumeRenderTarget(processEnv: NodeJS.ProcessEnv = process.env): PdfRenderTarget {
  return processEnv.RESUME_RENDER_TARGET === 'pdf' ? 'pdf' : 'web';
}

export function redactResumeData(sourceData: ResumeSourceData): ResumeData {
  const { email: _email, phone: _phone, ...publicBasics } = sourceData.basics;

  return {
    ...sourceData,
    basics: publicBasics,
  };
}
