/// <reference types="vite/client" />

declare module 'virtual:resume-data' {
  import type { ResumeData } from './data/types/resume';

  const resumeData: ResumeData;

  export default resumeData;
}
