import { expect, test } from '@playwright/test';

import { toAtsPdfResumeData } from '../src/features/pdf-download/presentation';
import type { ResumeSourceData } from '../src/data/types/resume';

test('flattens grouped progression roles for the ATS PDF presentation', async () => {
  const sourceData: ResumeSourceData = {
    basics: {
      label: 'Template Engineer',
      name: 'John Doe',
      summary: 'Template summary',
    },
    work: [
      {
        avoidPageBreakInside: true,
        company: 'Placeholder Labs',
        printBreakBefore: 'page',
        progression: [
          {
            company: '',
            endDate: '2019-12-20',
            position: 'Lead Product Engineer',
            startDate: '2018-05-01',
            summary: 'Led a platform refresh.',
          },
          {
            company: 'Role Specific Co',
            endDate: '2018-04-30',
            position: 'Senior Software Engineer',
            startDate: '2016-06-01',
            summary: 'Delivered product work.',
            website: 'https://example.com/role-specific',
          },
        ],
        website: 'https://example.com/placeholder-labs',
      },
    ],
  };

  const presentationData = toAtsPdfResumeData(sourceData);

  expect(sourceData.work?.[0] && 'progression' in sourceData.work[0]).toBeTruthy();
  expect(presentationData.work).toEqual([
    {
      avoidPageBreakInside: true,
      company: 'Placeholder Labs',
      endDate: '2019-12-20',
      position: 'Lead Product Engineer',
      printBreakBefore: 'page',
      startDate: '2018-05-01',
      summary: 'Led a platform refresh.',
      website: 'https://example.com/placeholder-labs',
    },
    {
      avoidPageBreakInside: true,
      company: 'Role Specific Co',
      endDate: '2018-04-30',
      position: 'Senior Software Engineer',
      startDate: '2016-06-01',
      summary: 'Delivered product work.',
      website: 'https://example.com/role-specific',
    },
  ]);
});

test('leaves standalone work entries unchanged for the ATS PDF presentation', async () => {
  const sourceData: ResumeSourceData = {
    basics: {
      label: 'Template Engineer',
      name: 'John Doe',
      summary: 'Template summary',
    },
    work: [
      {
        company: 'Acme Systems',
        endDate: '2025-09-26',
        position: 'Principal Engineer',
        startDate: '2023-02-24',
        summary: 'Owned the platform.',
        website: 'https://example.com/acme',
      },
    ],
  };

  const presentationData = toAtsPdfResumeData(sourceData);

  expect(presentationData.work).toEqual(sourceData.work);
});

test('leaves manual-mode data unchanged for the ATS PDF presentation', async () => {
  const sourceData: ResumeSourceData = {
    basics: {
      email: 'john.doe@example.com',
      label: 'Template Engineer',
      name: 'John Doe',
      phone: '+1 555-0100',
      summary: 'Template summary',
    },
    manual: {
      markdown: '# John Doe\n\nManual resume body.',
    },
    mode: 'manual',
    work: [
      {
        company: 'Acme Systems',
        endDate: '2025-09-26',
        position: 'Principal Engineer',
        startDate: '2023-02-24',
        summary: 'Owned the platform.',
      },
    ],
  };

  const presentationData = toAtsPdfResumeData(sourceData);

  expect(presentationData).toEqual(sourceData);
});
