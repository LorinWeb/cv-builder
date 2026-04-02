import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import Page from './Layout/Page';
import type { ResumeRuntimeData } from '../data/types/resume';
import { usePdfDownload } from '../features/pdf-download';

const ALLOWED_MARKDOWN_ELEMENTS = [
  'a',
  'blockquote',
  'br',
  'code',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'li',
  'ol',
  'p',
  'pre',
  'strong',
  'ul',
] as const;

interface MarkdownResumeProps {
  data: ResumeRuntimeData;
  isResumeStudioPreview?: boolean;
}

export function MarkdownResume({
  data,
  isResumeStudioPreview = false,
}: MarkdownResumeProps) {
  const { href, isAvailable, isPdfRenderTarget, label } = usePdfDownload();
  const markdown = data.markdown.trim();

  return (
    <Page data-testid="app">
      <div
        data-testid="markdown-resume-shell"
        className='relative bg-white font-[ui-serif,Georgia,Cambria,"Times New Roman",Times,serif] text-black'
      >
        {isAvailable && !isPdfRenderTarget && !isResumeStudioPreview ? (
          <a
            data-testid="markdown-resume-download"
            href={href}
            download
            className="absolute top-0 right-0 z-10 rounded-full border border-black bg-white px-3 py-1.5 text-sm font-medium no-underline print:hidden"
          >
            {label}
          </a>
        ) : null}

        <article data-testid="markdown-resume-article" className="mx-auto max-w-none text-[1rem]">
          {markdown ? (
            <div data-testid="markdown-resume-document" className="text-black">
              <ReactMarkdown
                allowedElements={[...ALLOWED_MARKDOWN_ELEMENTS]}
                remarkPlugins={[remarkGfm]}
                skipHtml
                unwrapDisallowed
                components={{
                  a: ({ children, href }) =>
                    href ? (
                      <a
                        href={href}
                        className="underline decoration-[0.08em] underline-offset-[0.18em]"
                      >
                        {children}
                      </a>
                    ) : (
                      <>{children}</>
                    ),
                  blockquote: ({ children }) => (
                    <blockquote className="my-5 border-l-2 border-black pl-4 italic">
                      {children}
                    </blockquote>
                  ),
                  br: () => <br />,
                  code: ({ children, className }) => {
                    if (className) {
                      return <code className={className}>{children}</code>;
                    }

                    return (
                      <code className="rounded border border-black/12 bg-black/4 px-1 py-[0.08em] font-[ui-monospace,SFMono-Regular,monospace] text-[0.92em]">
                        {children}
                      </code>
                    );
                  },
                  h1: ({ children }) => (
                    <h1 className="m-0 text-[2rem] leading-tight font-medium" style={{ color: '#000' }}>
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="mt-8 border-b border-black pb-2 text-[1.25rem] leading-tight font-medium first:mt-0">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="mt-6 mb-0 text-[1.05rem] leading-snug font-medium text-(--color-experience-headline)">
                      {children}
                    </h3>
                  ),
                  h4: ({ children }) => (
                    <h4 className="mt-4 mb-0 text-[1rem] leading-snug font-medium text-(--color-experience-headline)">
                      {children}
                    </h4>
                  ),
                  h5: ({ children }) => (
                    <h5 className="mt-4 mb-0 text-[0.95rem] leading-snug font-medium">
                      {children}
                    </h5>
                  ),
                  h6: ({ children }) => (
                    <h6 className="mt-4 mb-0 text-[0.9rem] leading-snug font-medium">
                      {children}
                    </h6>
                  ),
                  hr: () => <hr className="my-7 border-0 border-t border-black" />,
                  li: ({ children }) => <li className="leading-7">{children}</li>,
                  ol: ({ children }) => <ol className="my-3 list-decimal pl-5">{children}</ol>,
                  p: ({ children }) => <p className="m-0 leading-7 [&+p]:mt-4">{children}</p>,
                  pre: ({ children }) => (
                    <pre className="my-4 overflow-x-auto border border-black/12 bg-black/4 p-3 font-[ui-monospace,SFMono-Regular,monospace] text-[0.92em]">
                      {children}
                    </pre>
                  ),
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  ul: ({ children }) => <ul className="my-3 list-disc pl-5">{children}</ul>,
                }}
              >
                {markdown}
              </ReactMarkdown>
            </div>
          ) : null}
        </article>
      </div>
    </Page>
  );
}
