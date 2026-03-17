export const RESUME_STUDIO_API_ROOT = '/__resume-studio';
export const RESUME_STUDIO_AUTOSAVE_DELAY_MS = 500;
export const RESUME_STUDIO_DB_PATH = 'src/data/local/resume-studio.sqlite';
export const RESUME_STUDIO_PUBLIC_UPLOADS_DIR = 'public/static/private';
export const RESUME_STUDIO_PRIVATE_DATA_PATH = 'src/data/resume.private.json';
export const RESUME_STUDIO_DEFAULT_IMPORTED_VERSION_NAME = 'Imported current resume';
export const RESUME_STUDIO_DEFAULT_PRIMARY_VERSION_NAME = 'Primary resume';
export const RESUME_STUDIO_DEFAULT_RECOVERED_VERSION_NAME = 'Recovered current draft';
export const RESUME_STUDIO_DEFAULT_VERSION_NAME = 'Version';
export const RESUME_STUDIO_PREVIEW_FRAME_HEIGHT = 1123;
export const RESUME_STUDIO_PREVIEW_FRAME_WIDTH = 794;
export const RESUME_STUDIO_PREVIEW_MESSAGE_TYPE = 'resume-studio:preview-message';
export const RESUME_STUDIO_PREVIEW_QUERY_PARAM = 'resume-studio-preview';

export const RESUME_STUDIO_STEP_ORDER = [
  'basics',
  'contacts',
  'achievements',
  'experience',
  'skills',
  'education',
] as const;

export const RESUME_STUDIO_WATCH_IGNORED_PATTERNS = [
  '**/src/data/local/*.sqlite',
  '**/src/data/local/*.sqlite-*',
  '**/src/data/local/*.sqlite-wal',
  '**/src/data/local/*.sqlite-shm',
] as const;
