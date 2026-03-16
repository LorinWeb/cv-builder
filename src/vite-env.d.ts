/// <reference types="vite/client" />

declare module 'virtual:resume-data' {
  import type { ResumeRuntimeData } from './data/types/resume';

  const resumeData: ResumeRuntimeData;

  export default resumeData;
}

declare const __RESUME_RENDER_TARGET__: import('./features/pdf-download/types').PdfRenderTarget;
