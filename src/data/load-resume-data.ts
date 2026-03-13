import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseResumeData } from './resume-schema';
import type { ResumeData } from './types/resume';

export const DEFAULT_RESUME_DATA_PATH = 'src/data/resume.sample.json';

interface ResumeDataLoadOptions {
  envDir?: string;
  mode?: string;
  useProcessEnv?: boolean;
}

const PROJECT_ROOT = fileURLToPath(new URL('../..', import.meta.url));

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

function readConfiguredEnv({
  envDir = PROJECT_ROOT,
  mode = 'development',
  useProcessEnv = true,
}: ResumeDataLoadOptions = {}) {
  const resolvedEnvDir = path.resolve(envDir);
  const env: Record<string, string> = {};

  for (const fileName of getEnvFileNames(mode)) {
    const filePath = path.join(resolvedEnvDir, fileName);

    if (!existsSync(filePath)) {
      continue;
    }

    Object.assign(env, parseEnvFile(readFileSync(filePath, 'utf8')));
  }

  if (useProcessEnv && process.env.RESUME_DATA_PATH) {
    env.RESUME_DATA_PATH = process.env.RESUME_DATA_PATH;
  }

  return { env, resolvedEnvDir };
}

export function resolveResumeDataPath(options: ResumeDataLoadOptions = {}) {
  const { env, resolvedEnvDir } = readConfiguredEnv(options);
  const configuredPath = env.RESUME_DATA_PATH || DEFAULT_RESUME_DATA_PATH;

  return path.resolve(resolvedEnvDir, configuredPath);
}

export function loadResumeData(options: ResumeDataLoadOptions = {}): ResumeData {
  const resolvedPath = resolveResumeDataPath(options);
  let rawJson = '';

  try {
    rawJson = readFileSync(resolvedPath, 'utf8');
  } catch (error) {
    throw new Error(
      `Resume data file was not found at ${resolvedPath}. Set RESUME_DATA_PATH in .env or .env.local to a valid JSON file.`,
      {
        cause: error,
      }
    );
  }

  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(rawJson);
  } catch (error) {
    throw new Error(`Resume data file at ${resolvedPath} is not valid JSON.`, {
      cause: error,
    });
  }

  try {
    return parseResumeData(parsedJson);
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
