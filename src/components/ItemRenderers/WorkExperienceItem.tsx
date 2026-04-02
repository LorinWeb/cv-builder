import { formatDateRange, formatDateRangeWithDuration } from '../../helpers/date-range';
import { joinClassNames } from '../../helpers/classNames';
import { ResumeMarkdown } from '../../helpers/resume-markdown';
import { getPrintClassNames } from '../../helpers/print';
import { getTextValueSource } from '../../helpers/text-value';
import type {
  ResumeWorkEntry,
  ResumeWorkGroup,
  ResumeWorkItem,
  TextValue,
} from '../../data/types/resume';

interface WorkExperienceItemProps {
  className?: string;
  item: ResumeWorkItem;
  showDuration?: boolean;
}

function getDateRangeLabel(
  startDate: string,
  endDate: string | null | undefined,
  showDuration: boolean
) {
  return showDuration
    ? formatDateRangeWithDuration(startDate, endDate)
    : formatDateRange(startDate, endDate);
}

function getProgressionBounds(entries: ResumeWorkEntry[]) {
  return entries.reduce(
    (bounds, entry) => {
      const hasNoEndDate = !entry.endDate;

      if (!bounds.startDate || new Date(entry.startDate) < new Date(bounds.startDate)) {
        bounds.startDate = entry.startDate;
      }

      if (hasNoEndDate) {
        bounds.endDate = '';
      } else if (bounds.endDate !== '') {
        if (
          entry.endDate &&
          (!bounds.endDate || new Date(entry.endDate) > new Date(bounds.endDate))
        ) {
          bounds.endDate = entry.endDate;
        }
      }

      return bounds;
    },
    { endDate: null as string | null, startDate: '' }
  );
}

function renderHighlights(highlights?: TextValue[]) {
  if (!highlights || highlights.length === 0) {
    return null;
  }

  return (
    <div data-testid="work-experience-highlights">
      <ul className="mt-0 list-square pl-5 font-light">
        {highlights.map((highlight, index) => (
          <li key={index}>
            <ResumeMarkdown markdown={getTextValueSource(highlight)} mode="inline" />
          </li>
        ))}
      </ul>
    </div>
  );
}

function renderSingleWorkItem(
  item: ResumeWorkEntry,
  showDuration: boolean,
  className?: string
) {
  const { company, endDate, highlights, position, startDate, summary } = item;

  return (
    <article
      data-testid="work-experience-item"
      className={joinClassNames('mb-5 mt-3.75', className)}
    >
      <h3 className="mb-0 flex flex-wrap items-baseline gap-1 font-medium text-(--color-experience-headline)">
        {position}
        <span className="inline-flex items-baseline gap-1 whitespace-nowrap">
          <span className="font-light">@</span>
          <span className="font-light">{company}</span>
        </span>
      </h3>
      <p data-testid="work-experience-date" className="my-[0.5em] mt-0 block text-[0.85em]">
        {getDateRangeLabel(startDate, endDate, showDuration)}
      </p>
      <ResumeMarkdown
        className="my-[0.5em] mb-0"
        markdown={summary}
        mode="block"
      />
      {renderHighlights(highlights)}
    </article>
  );
}

function renderProgressionEntry(entry: ResumeWorkEntry, showDuration: boolean) {
  return (
    <article
      data-testid="work-progression-entry"
      className={joinClassNames('mb-4.5 last:mb-0', getPrintClassNames(entry))}
      key={`${entry.company}-${entry.position}-${entry.startDate}`}
    >
      <h4 className="mb-0 mt-2.5 flex flex-wrap items-baseline gap-1 font-medium text-(--color-experience-headline)">
        {entry.position}
      </h4>
      <p data-testid="work-experience-date" className="my-[0.5em] mt-0 block text-[0.85em]">
        {getDateRangeLabel(entry.startDate, entry.endDate, showDuration)}
      </p>
      <ResumeMarkdown
        className="my-[0.5em] mb-0"
        markdown={entry.summary}
        mode="block"
      />
      {renderHighlights(entry.highlights)}
    </article>
  );
}

function renderProgressionGroup(
  item: ResumeWorkGroup,
  showDuration: boolean,
  className?: string
) {
  const progression = item.progression || [];
  const companyName = item.company || progression[0]?.company || '';
  const { endDate, startDate } = getProgressionBounds(progression);

  return (
    <article
      data-testid="work-progression-group"
      className={joinClassNames('mb-5.5 mt-4.5', className)}
    >
      <header className="mb-2.5">
        <h3 className="m-0 font-medium text-(--color-experience-headline)">
          <span className="inline-flex items-baseline gap-1 whitespace-nowrap">
            <span>@</span>
            <span>{companyName}</span>
          </span>
        </h3>
        {startDate ? (
          <p data-testid="work-experience-date" className="m-0 text-[0.85em]">
            {getDateRangeLabel(startDate, endDate, showDuration)}
          </p>
        ) : null}
      </header>
      <div className="ml-0.5 border-l border-l-(--color-main-border) pl-3.5">
        {progression.map((entry) => renderProgressionEntry(entry, showDuration))}
      </div>
    </article>
  );
}

function isProgressionGroup(item: ResumeWorkItem): item is ResumeWorkGroup {
  return Array.isArray((item as ResumeWorkGroup).progression);
}

function WorkExperienceItem({
  className,
  item,
  showDuration = true,
}: WorkExperienceItemProps) {
  if (isProgressionGroup(item)) {
    return renderProgressionGroup(item, showDuration, className);
  }

  return renderSingleWorkItem(item, showDuration, className);
}

export default WorkExperienceItem;
