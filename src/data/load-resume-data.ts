import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { ResumeSourceData } from './types/resume';

interface ResumeDataLoadOptions {
  projectRoot?: string;
}

export const RESUME_DATA_PATH = 'src/data/resume.md';

const PROJECT_ROOT = fileURLToPath(new URL('../..', import.meta.url));

function resolveProjectPath(projectRoot: string, relativePath: string) {
  return path.resolve(projectRoot, relativePath);
}

export function getResumeDataWatchPaths({
  projectRoot = PROJECT_ROOT,
}: Pick<ResumeDataLoadOptions, 'projectRoot'> = {}) {
  return [resolveProjectPath(projectRoot, RESUME_DATA_PATH)];
}

export function resolveResumeDataPath(options: ResumeDataLoadOptions = {}) {
  return resolveProjectPath(options.projectRoot ?? PROJECT_ROOT, RESUME_DATA_PATH);
}

export function loadResumeData(options: ResumeDataLoadOptions = {}): ResumeSourceData {
  const resolvedPath = resolveResumeDataPath(options);

  let markdown: string;

  try {
    markdown = readFileSync(resolvedPath, 'utf8');
  } catch (error) {
    throw new Error(
      `Resume markdown file was not found at ${resolvedPath}. Create ${RESUME_DATA_PATH}.`,
      {
        cause: error,
      }
    );
  }

  if (!markdown.trim()) {
    throw new Error(
      `Resume markdown file at ${resolvedPath} must not be empty. Add markdown content to ${RESUME_DATA_PATH}.`
    );
  }

  return {
    markdown: markdown.replace(/\r\n?/g, '\n'),
  };
}
