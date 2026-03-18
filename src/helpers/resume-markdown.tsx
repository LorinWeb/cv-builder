import type { ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { joinClassNames } from './classNames';

const BLOCK_ALLOWED_ELEMENTS = ['a', 'br', 'code', 'em', 'li', 'ol', 'p', 'strong', 'ul'];
const INLINE_ALLOWED_ELEMENTS = ['a', 'br', 'code', 'em', 'strong'];

interface ResumeMarkdownProps {
  className?: string;
  dataTestId?: string;
  markdown: string;
  mode: 'block' | 'inline';
}

function renderLink(children: ReactNode, href?: string) {
  if (!href) {
    return <>{children}</>;
  }

  return (
    <a
      href={href}
      className="wrap-break-word underline decoration-[0.08em] underline-offset-[0.16em]"
    >
      {children}
    </a>
  );
}

export function ResumeMarkdown({
  className,
  dataTestId,
  markdown,
  mode,
}: ResumeMarkdownProps) {
  const trimmedMarkdown = markdown.trim();

  if (trimmedMarkdown.length === 0) {
    return null;
  }

  const content = (
    <ReactMarkdown
      allowedElements={mode === 'block' ? BLOCK_ALLOWED_ELEMENTS : INLINE_ALLOWED_ELEMENTS}
      remarkPlugins={[remarkGfm]}
      skipHtml
      unwrapDisallowed
      components={{
        a: ({ children, href }) => renderLink(children, href),
        br: () => <br />,
        code: ({ children }) => (
          <code className="rounded bg-(--color-inline-code-background) px-1 py-[0.1em] font-[ui-monospace,SFMono-Regular,monospace] text-[0.92em]">
            {children}
          </code>
        ),
        em: ({ children }) => <em>{children}</em>,
        li: ({ children }) => <li className="font-light">{children}</li>,
        ol: ({ children }) => <ol className="my-[0.5em] list-decimal pl-5">{children}</ol>,
        p: ({ children }) => <p className="m-0 mb-2.5 last:mb-0">{children}</p>,
        strong: ({ children }) => <strong className="font-medium">{children}</strong>,
        ul: ({ children }) => <ul className="my-[0.5em] list-square pl-5">{children}</ul>,
      }}
    >
      {trimmedMarkdown}
    </ReactMarkdown>
  );

  if (mode === 'inline') {
    return (
      <span data-testid={dataTestId} className={joinClassNames('inline', className)}>
        {content}
      </span>
    );
  }

  return (
    <div data-testid={dataTestId} className={className}>
      {content}
    </div>
  );
}
