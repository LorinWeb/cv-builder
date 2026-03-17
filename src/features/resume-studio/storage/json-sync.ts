import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { resumeDataSchema } from '../../../data/resume-schema';
import type { ResumeSourceData } from '../../../data/types/resume';
import { RESUME_STUDIO_DB_PATH, RESUME_STUDIO_PRIVATE_DATA_PATH, RESUME_STUDIO_PUBLIC_UPLOADS_DIR } from '../constants';

export interface ResumeStudioPaths {
  databasePath: string;
  privateDataPath: string;
  publicUploadsDir: string;
}

export function resolveResumeStudioPaths(projectRoot: string): ResumeStudioPaths {
  return {
    databasePath: path.resolve(projectRoot, RESUME_STUDIO_DB_PATH),
    privateDataPath: path.resolve(projectRoot, RESUME_STUDIO_PRIVATE_DATA_PATH),
    publicUploadsDir: path.resolve(projectRoot, RESUME_STUDIO_PUBLIC_UPLOADS_DIR),
  };
}

function parseResumeSourceData(value: unknown, source: string) {
  const result = resumeDataSchema.safeParse(value);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`)
      .join('; ');

    throw new Error(`Resume Studio failed to validate ${source}. ${issues}`);
  }

  return result.data;
}

export function readResumeStudioPrivateData(projectRoot: string): ResumeSourceData | null {
  const { privateDataPath } = resolveResumeStudioPaths(projectRoot);

  if (!existsSync(privateDataPath)) {
    return null;
  }

  return parseResumeSourceData(
    JSON.parse(readFileSync(privateDataPath, 'utf8')) as unknown,
    privateDataPath
  );
}

export function writeResumeStudioPrivateData(
  projectRoot: string,
  data: ResumeSourceData
) {
  const { privateDataPath } = resolveResumeStudioPaths(projectRoot);
  const parsed = parseResumeSourceData(data, privateDataPath);

  mkdirSync(path.dirname(privateDataPath), { recursive: true });
  writeFileSync(privateDataPath, `${JSON.stringify(parsed, null, 2)}\n`);
}

export function ensureResumeStudioDirectory(filePath: string) {
  mkdirSync(path.dirname(filePath), { recursive: true });
}
