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

test('builds meta descriptions from markdown summaries', async () => {
  expect(
    getMetaDescription({
      basics: {
        label: 'Staff Engineer',
        name: 'Jane Doe',
        summary:
          'Lead **platform** work.\n\nBuilt [design systems](https://example.com) for product teams.',
      },
    })
  ).toBe('Lead platform work.');
});

test('derives the manual resume title from the first level-one heading', async () => {
  expect(
    getDocumentTitle({
      basics: {
        label: 'Staff Engineer',
        name: 'Jane Doe',
        summary: 'Unused for manual mode',
      },
      manual: {
        markdown: '# Jane Doe\n\n**Staff Engineer**\n\n## Summary\n\nLead platform work.',
      },
      mode: 'manual',
    })
  ).toBe('Jane Doe CV');
});

test('falls back to a generic title when manual markdown has no level-one heading', async () => {
  expect(
    getDocumentTitle({
      basics: {
        label: 'Staff Engineer',
        name: 'Jane Doe',
        summary: 'Unused for manual mode',
      },
      manual: {
        markdown: 'No heading here',
      },
      mode: 'manual',
    })
  ).toBe('Resume');
});

test('builds meta descriptions from the first non-heading manual markdown block', async () => {
  expect(
    getMetaDescription({
      basics: {
        label: 'Staff Engineer',
        name: 'Jane Doe',
        summary: 'Unused for manual mode',
      },
      manual: {
        markdown:
          '# Jane Doe\n**Staff Engineer**\nLondon, UK\n\n## Summary\n\nLead **platform** work. Built [systems](https://example.com).',
      },
      mode: 'manual',
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
