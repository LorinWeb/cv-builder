import {
  RESUME_PDF_DOWNLOAD_HREF,
  RESUME_PDF_DOWNLOAD_LABEL,
} from './constants';
import type { PdfRenderTarget } from './types';

const CURRENT_RENDER_TARGET: PdfRenderTarget =
  typeof __RESUME_RENDER_TARGET__ === 'string' ? __RESUME_RENDER_TARGET__ : 'web';

export function usePdfDownload(target: PdfRenderTarget = CURRENT_RENDER_TARGET) {
  return {
    href: RESUME_PDF_DOWNLOAD_HREF,
    isAvailable: true,
    isPdfRenderTarget: target === 'pdf',
    label: RESUME_PDF_DOWNLOAD_LABEL,
  };
}
