import Page from './Layout/Page';
import { ManualResumeMarkdown } from './ManualResumeMarkdown';
import { usePdfDownload } from '../features/pdf-download';
import type { ResumeRuntimeData } from '../data/types/resume';

interface ManualResumeProps {
  data: ResumeRuntimeData;
  isResumeStudioPreview?: boolean;
}

export function ManualResume({ data, isResumeStudioPreview = false }: ManualResumeProps) {
  const { href, isAvailable, isPdfRenderTarget, label } = usePdfDownload();

  return (
    <Page data-testid="app">
      <div
        data-testid="manual-resume-shell"
        className='relative bg-white text-black font-[ui-serif,Georgia,Cambria,"Times New Roman",Times,serif]'
      >
        {isAvailable && !isPdfRenderTarget && !isResumeStudioPreview ? (
          <a
            data-testid="manual-resume-download"
            href={href}
            download
            className="absolute top-0 right-0 z-10 rounded-full border border-black bg-white px-3 py-1.5 text-sm font-medium no-underline print:hidden"
          >
            {label}
          </a>
        ) : null}

        <article
          data-testid="manual-resume-article"
          className="mx-auto max-w-none text-[1rem]"
        >
          <ManualResumeMarkdown markdown={data.manual?.markdown || ''} />
        </article>
      </div>
    </Page>
  );
}
