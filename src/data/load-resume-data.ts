import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseResumeData } from './resume-schema';
import type { ResumeSourceData } from './types/resume';

interface ResumeDataLoadOptions {
  mode?: string;
  projectRoot?: string;
}

export const SAMPLE_RESUME_DATA_PATH = 'src/data/resume.sample.json';
export const PRIVATE_RESUME_DATA_PATH = 'src/data/resume.private.json';

const PROJECT_ROOT = fileURLToPath(new URL('../..', import.meta.url));
const PUBLIC_ASSET_PREFIX = '/static/';
const TEST_MODE = 'test';

function isLocalPublicAssetPath(assetPath: string) {
  return assetPath.startsWith(PUBLIC_ASSET_PREFIX);
}

function resolveLocalPublicAssetPath(assetPath: string, projectRoot: string) {
  return path.resolve(projectRoot, 'public', assetPath.replace(/^\//, ''));
}

function resolveProjectPath(projectRoot: string, relativePath: string) {
  return path.resolve(projectRoot, relativePath);
}

function resolveResumeCandidatePaths(projectRoot: string) {
  return {
    privatePath: resolveProjectPath(projectRoot, PRIVATE_RESUME_DATA_PATH),
    samplePath: resolveProjectPath(projectRoot, SAMPLE_RESUME_DATA_PATH),
  };
}

function validateResumePhotoAsset(data: ResumeSourceData, projectRoot: string) {
  const photoSrc = data.basics.photo?.src;

  if (!photoSrc || !isLocalPublicAssetPath(photoSrc)) {
    return;
  }

  const resolvedPhotoPath = resolveLocalPublicAssetPath(photoSrc, projectRoot);

  if (existsSync(resolvedPhotoPath)) {
    return;
  }

  throw new Error(
    `Resume photo file was not found at ${resolvedPhotoPath}. Set basics.photo.src to a valid file under public/static or update your private local photo asset.`
  );
}

function readResumeSourceDataJson(options: ResumeDataLoadOptions = {}) {
  const resolvedPath = resolveResumeDataPath(options);

  try {
    return {
      data: JSON.parse(readFileSync(resolvedPath, 'utf8')) as unknown,
      resolvedPath,
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Resume data file at ${resolvedPath} is not valid JSON.`, {
        cause: error,
      });
    }

    throw new Error(
      `Resume data file was not found at ${resolvedPath}. Create ${PRIVATE_RESUME_DATA_PATH} by copying ${SAMPLE_RESUME_DATA_PATH}, or restore the sample resume data file.`,
      {
        cause: error,
      }
    );
  }
}

export function getResumeDataWatchPaths({
  projectRoot = PROJECT_ROOT,
}: Pick<ResumeDataLoadOptions, 'projectRoot'> = {}) {
  const { privatePath, samplePath } = resolveResumeCandidatePaths(projectRoot);

  return [samplePath, privatePath];
}

export function resolveResumeDataPath(options: ResumeDataLoadOptions = {}) {
  const projectRoot = options.projectRoot ?? PROJECT_ROOT;
  const { privatePath, samplePath } = resolveResumeCandidatePaths(projectRoot);

  if (options.mode === TEST_MODE) {
    return samplePath;
  }

  return existsSync(privatePath) ? privatePath : samplePath;
}

export function loadResumeData(options: ResumeDataLoadOptions = {}): ResumeSourceData {
  const projectRoot = options.projectRoot ?? PROJECT_ROOT;
  const resolvedPath = resolveResumeDataPath({
    ...options,
    projectRoot,
  });
  const { data: parsedJson } = readResumeSourceDataJson({
    ...options,
    projectRoot,
  });

  try {
    const resumeData = parseResumeData(parsedJson);

    validateResumePhotoAsset(resumeData, projectRoot);

    return resumeData;
  } catch (error) {
    throw new Error(
      `Resume data file at ${resolvedPath} failed validation. ${
        error instanceof Error ? error.message : ''
      }`.trim(),
      {
        cause: error,
      }
    );
  }
}
