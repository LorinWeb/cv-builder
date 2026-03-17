import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

export function createTempProjectRoot(prefix = 'resume-studio-') {
  const projectRoot = mkdtempSync(path.join(tmpdir(), prefix));

  mkdirSync(path.join(projectRoot, 'src/data'), { recursive: true });
  mkdirSync(path.join(projectRoot, 'public'), { recursive: true });

  return projectRoot;
}

export function destroyTempProjectRoot(projectRoot: string) {
  rmSync(projectRoot, { force: true, recursive: true });
}

export function writeProjectFile(
  projectRoot: string,
  relativePath: string,
  contents: string
) {
  const filePath = path.join(projectRoot, relativePath);

  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, contents);

  return filePath;
}
