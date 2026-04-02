import {
  differenceInCalendarMonths,
  format,
  isValid,
  parseISO,
  startOfMonth,
} from 'date-fns';

const ISO_LIKE_DATE_PATTERN = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;

function normalizeDateInput(date: string) {
  return date.replace(
    ISO_LIKE_DATE_PATTERN,
    (_match, year, month, day) =>
      `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  );
}

function parseResumeDate(date?: string | null) {
  if (!date) {
    return null;
  }

  const normalized = normalizeDateInput(date);
  const parsed = parseISO(normalized);

  if (isValid(parsed)) {
    return parsed;
  }

  const fallback = new Date(normalized);

  return isValid(fallback) ? fallback : null;
}

export function formatDate(date?: string | null) {
  if (!date) {
    return 'Present';
  }

  const parsed = parseResumeDate(date);

  return parsed ? format(parsed, 'MMM yyyy') : date;
}

export function formatDuration(startDate: string, endDate?: string | null) {
  const start = parseResumeDate(startDate);
  const end = parseResumeDate(endDate) ?? new Date();

  if (!start) {
    return '0 months';
  }

  const startMonth = startOfMonth(start);
  const endMonth = startOfMonth(end);
  const totalMonths =
    endMonth.getTime() < startMonth.getTime()
      ? 0
      : differenceInCalendarMonths(endMonth, startMonth) + 1;
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const parts: string[] = [];

  if (years) {
    parts.push(`${years} year${years === 1 ? '' : 's'}`);
  }

  if (months) {
    parts.push(`${months} month${months === 1 ? '' : 's'}`);
  }

  if (parts.length === 0) {
    return '0 months';
  }

  return parts.join(', ');
}

export function formatDateRange(startDate: string, endDate?: string | null) {
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

export function formatDateRangeWithDuration(startDate: string, endDate?: string | null) {
  return `${formatDateRange(startDate, endDate)} [${formatDuration(startDate, endDate)}]`;
}
