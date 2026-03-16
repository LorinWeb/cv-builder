import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import {
  DEFAULT_RESUME_DATA_PATH,
  RESUME_DATA_PATH_ENV_VAR,
} from '../../../data/resume-data-paths';
import type { ResumeData, ResumeSourceData } from '../../../data/types/resume';
import type { PdfRenderTarget } from '../types';

interface ResumeDataConfigOptions {
  envDir?: string;
  mode?: string;
  processEnv?: NodeJS.ProcessEnv;
  projectRoot?: string;
  useProcessEnv?: boolean;
}

function getEnvFileNames(mode: string) {
  return ['.env', '.env.local', `.env.${mode}`, `.env.${mode}.local`];
}

function stripMatchingQuotes(value: string) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function parseEnvFile(contents: string) {
  const env: Record<string, string> = {};

  for (const line of contents.split(/\r?\n/)) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const rawValue = trimmedLine.slice(separatorIndex + 1).trim();

    env[key] = stripMatchingQuotes(rawValue);
  }

  return env;
}

export function resolveResumeDataConfig({
  envDir,
  mode = 'development',
  projectRoot,
  processEnv = process.env,
  useProcessEnv = true,
}: ResumeDataConfigOptions = {}) {
  const resolvedEnvDir = path.resolve(envDir || projectRoot || process.cwd());
  const env: Record<string, string> = {};

  for (const fileName of getEnvFileNames(mode)) {
    const filePath = path.join(resolvedEnvDir, fileName);

    if (!existsSync(filePath)) {
      continue;
    }

    Object.assign(env, parseEnvFile(readFileSync(filePath, 'utf8')));
  }

  if (useProcessEnv && processEnv[RESUME_DATA_PATH_ENV_VAR]) {
    env[RESUME_DATA_PATH_ENV_VAR] = processEnv[RESUME_DATA_PATH_ENV_VAR];
  }

  return {
    env,
    resolvedEnvDir,
  };
}

export function resolveResumeDataPath(options: ResumeDataConfigOptions = {}) {
  const { env, resolvedEnvDir } = resolveResumeDataConfig(options);

  return path.resolve(
    resolvedEnvDir,
    env[RESUME_DATA_PATH_ENV_VAR] || DEFAULT_RESUME_DATA_PATH
  );
}

export function readResumeSourceDataJson(options: ResumeDataConfigOptions = {}) {
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
      `Resume data file was not found at ${resolvedPath}. Set ${RESUME_DATA_PATH_ENV_VAR} in .env or .env.local to a valid JSON file.`,
      {
        cause: error,
      }
    );
  }
}

export function getResumeRenderTarget(processEnv: NodeJS.ProcessEnv = process.env): PdfRenderTarget {
  return processEnv.RESUME_RENDER_TARGET === 'pdf' ? 'pdf' : 'web';
}

export function redactResumeData(sourceData: ResumeSourceData): ResumeData {
  const { email: _email, phone: _phone, ...publicBasics } = sourceData.basics;

  return {
    ...sourceData,
    basics: publicBasics,
  };
}
