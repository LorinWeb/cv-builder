import { expect, test } from '@playwright/test';

import { getMetaDescription } from '../src/helpers/seo';
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
