import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  readResumeSourceDataJson,
  resolveResumeDataConfig,
  resolveResumeDataPath as resolveResumeDataPathFromBuildHelpers,
} from '../features/pdf-download/build';
import { parseResumeData } from './resume-schema';
import type { ResumeSourceData } from './types/resume';

interface ResumeDataLoadOptions {
  envDir?: string;
  mode?: string;
  processEnv?: NodeJS.ProcessEnv;
  projectRoot?: string;
  useProcessEnv?: boolean;
}

const PROJECT_ROOT = fileURLToPath(new URL('../..', import.meta.url));
const PUBLIC_ASSET_PREFIX = '/static/';

function isLocalPublicAssetPath(assetPath: string) {
  return assetPath.startsWith(PUBLIC_ASSET_PREFIX);
}

function resolveLocalPublicAssetPath(assetPath: string, projectRoot: string) {
  return path.resolve(projectRoot, 'public', assetPath.replace(/^\//, ''));
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

export function resolveResumeDataPath(options: ResumeDataLoadOptions = {}) {
  return resolveResumeDataPathFromBuildHelpers({
    ...options,
    projectRoot: options.projectRoot ?? PROJECT_ROOT,
  });
}

export function loadResumeData(options: ResumeDataLoadOptions = {}): ResumeSourceData {
  const { resolvedEnvDir } = resolveResumeDataConfig({
    ...options,
    projectRoot: options.projectRoot ?? PROJECT_ROOT,
  });
  const resolvedPath = resolveResumeDataPath({
    ...options,
  });
  const { data: parsedJson } = readResumeSourceDataJson({
    ...options,
    projectRoot: options.projectRoot ?? PROJECT_ROOT,
  });

  try {
    const resumeData = parseResumeData(parsedJson);

    validateResumePhotoAsset(resumeData, resolvedEnvDir);

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
