import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { RESUME_STUDIO_PUBLIC_UPLOADS_DIR } from '../constants';
import type { ResumeStudioPhotoUploadResult } from '../types';

function sanitizeFileName(fileName: string) {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function writeResumeStudioPhotoUpload(
  projectRoot: string,
  fileName: string,
  bytesBase64: string
): ResumeStudioPhotoUploadResult {
  const safeFileName = sanitizeFileName(fileName || 'profile-image');
  const extension = path.extname(safeFileName) || '.png';
  const baseName = path.basename(safeFileName, extension) || 'profile-image';
  const outputDir = path.resolve(projectRoot, RESUME_STUDIO_PUBLIC_UPLOADS_DIR);
  const outputFileName = `${baseName}-${Date.now()}${extension}`;
  const outputPath = path.join(outputDir, outputFileName);

  mkdirSync(outputDir, { recursive: true });
  writeFileSync(outputPath, Buffer.from(bytesBase64, 'base64'));

  return {
    src: `/static/private/${outputFileName}`,
  };
}
