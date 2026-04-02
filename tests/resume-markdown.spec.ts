import { expect, test } from '@playwright/test';

import { normalizeResumeStudioMarkdown } from '../src/features/resume-studio/draft';
import { getDocumentTitle, getMetaDescription } from '../src/helpers/seo';
import { stripMarkdownToPlainText } from '../src/helpers/markdown';

test('strips markdown syntax while preserving visible text', async () => {
  expect(
    stripMarkdownToPlainText(
      'Lead **platform** work with [docs](https://example.com).\n\n- Shipped `tooling`'
    )
  ).toBe('Lead platform work with docs. Shipped tooling');
});

test('derives the document title from the first level-one heading', async () => {
  expect(
    getDocumentTitle({
      markdown: '# Jane Doe\n\n**Staff Engineer**\n\n## Summary\n\nLead platform work.',
    })
  ).toBe('Jane Doe CV');
});

test('falls back to a generic title when markdown has no level-one heading', async () => {
  expect(
    getDocumentTitle({
      markdown: 'No heading here',
    })
  ).toBe('Resume');
});

test('builds meta descriptions from the first non-heading markdown block', async () => {
  expect(
    getMetaDescription({
      markdown:
        '# Jane Doe\n**Staff Engineer**\nLondon, UK\n\n## Summary\n\nLead **platform** work. Built [systems](https://example.com).',
    })
  ).toBe('Lead platform work.');
});

test('normalizes manual hard breaks to escaped line breaks for the studio editor', async () => {
  expect(
    normalizeResumeStudioMarkdown('London, UK  \n+44 123456789  \nhello@example.com')
  ).toBe('London, UK\\\n+44 123456789\\\nhello@example.com');
});

test('does not rewrite trailing spaces inside fenced code blocks', async () => {
  expect(
    normalizeResumeStudioMarkdown('```\nconst value = 1;  \n```\nLine two  ')
  ).toBe('```\nconst value = 1;  \n```\nLine two\\');
});
