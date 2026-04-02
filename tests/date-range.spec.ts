import { expect, test } from '@playwright/test';

import {
  formatDate,
  formatDateRange,
  formatDateRangeWithDuration,
  formatDuration,
} from '../src/helpers/date-range';

test('renders ongoing roles as Present', async () => {
  expect(formatDate('')).toBe('Present');
  expect(formatDateRangeWithDuration('2025-10-01', '')).toContain('Present');
});

test('counts month ranges inclusively', async () => {
  expect(formatDuration('2023-02-24', '2025-09-26')).toBe('2 years, 8 months');
});

test('clamps reversed ranges to zero months', async () => {
  expect(formatDuration('2025-10-01', '2025-09-01')).toBe('0 months');
});

test('keeps loose ISO-like dates working', async () => {
  expect(formatDateRangeWithDuration('2010-06-1', '2018-08-24')).toBe(
    'Jun 2010 - Aug 2018 [8 years, 3 months]'
  );
});

test('renders date ranges without computed durations when requested', async () => {
  expect(formatDateRange('2023-02-24', '2025-09-26')).toBe('Feb 2023 - Sep 2025');
  expect(formatDateRange('2025-10-01', '')).toBe('Oct 2025 - Present');
});
