export const RESUME_STUDIO_API_ROOT = '/__resume-studio';
export const RESUME_STUDIO_AUTOSAVE_DELAY_MS = 500;
export const RESUME_STUDIO_DB_PATH = 'src/data/local/resume-studio.sqlite';
export const RESUME_STUDIO_MARKDOWN_PATH = 'src/data/resume.md';
export const RESUME_STUDIO_DEFAULT_IMPORTED_VERSION_NAME = 'Imported current resume';
export const RESUME_STUDIO_PREVIEW_FRAME_HEIGHT = 1123;
export const RESUME_STUDIO_PREVIEW_FRAME_WIDTH = 794;
export const RESUME_STUDIO_PREVIEW_MESSAGE_TYPE = 'resume-studio:preview-message';
export const RESUME_STUDIO_PREVIEW_QUERY_PARAM = 'resume-studio-preview';
export const RESUME_STUDIO_SCROLL_SYNC_READY_MESSAGE_TYPE =
  'resume-studio:scroll-sync-ready';
export const RESUME_STUDIO_SCROLL_SYNC_SET_MESSAGE_TYPE =
  'resume-studio:scroll-sync-set';
export const RESUME_STUDIO_SCROLL_SYNC_UPDATE_MESSAGE_TYPE =
  'resume-studio:scroll-sync-update';

export const RESUME_STUDIO_WATCH_IGNORED_PATTERNS = [
  '**/src/data/local/*.sqlite',
  '**/src/data/local/*.sqlite-*',
  '**/src/data/local/*.sqlite-wal',
  '**/src/data/local/*.sqlite-shm',
] as const;
