import type { PdfRenderTarget } from '../types';

export function getResumeRenderTarget(processEnv: NodeJS.ProcessEnv = process.env): PdfRenderTarget {
  return processEnv.RESUME_RENDER_TARGET === 'pdf' ? 'pdf' : 'web';
}
