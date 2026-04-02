import type { ResumeRuntimeData, ResumeSourceData } from '../../../data/types/resume';
import type { PdfRenderTarget } from '../types';

export function getResumeRenderTarget(processEnv: NodeJS.ProcessEnv = process.env): PdfRenderTarget {
  return processEnv.RESUME_RENDER_TARGET === 'pdf' ? 'pdf' : 'web';
}

export function redactResumeData(sourceData: ResumeSourceData): ResumeRuntimeData {
  if (sourceData.mode === 'manual') {
    return sourceData;
  }

  const { email: _email, phone: _phone, ...publicBasics } = sourceData.basics;

  return {
    ...sourceData,
    basics: publicBasics,
  };
}
