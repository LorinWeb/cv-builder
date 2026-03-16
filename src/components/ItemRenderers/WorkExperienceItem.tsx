import { formatDateRangeWithDuration } from '../../helpers/date-range';
import { joinClassNames } from '../../helpers/classNames';
import { getPrintClassNames } from '../../helpers/print';
import { getTextValue } from '../../helpers/text-value';
import type {
  ResumeWorkEntry,
  ResumeWorkGroup,
  ResumeWorkItem,
  TextValue,
} from '../../data/types/resume';

interface WorkExperienceItemProps {
  className?: string;
  item: ResumeWorkItem;
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
      <ul className="mt-0 list-square pl-5 font-light leading-[1.3em]">
        {highlights.map((highlight, index) => (
          <li key={index}>{getTextValue(highlight)}</li>
        ))}
      </ul>
    </div>
  );
}

function renderSingleWorkItem(item: ResumeWorkEntry, className?: string) {
  const { company, endDate, highlights, position, startDate, summary } = item;

  return (
    <article
      data-testid="work-experience-item"
      className={joinClassNames('mb-5 mt-3.75', className)}
    >
      <h3 className="mb-0 flex flex-wrap items-baseline gap-1 font-medium leading-[1.3] text-(--color-primary)">
        {position}
        <span className="inline-flex items-baseline gap-1 whitespace-nowrap">
          <span className="font-light text-(--color-secondary)">@</span>
          <span className="font-light text-(--color-secondary)">{company}</span>
        </span>
      </h3>
      <p className="my-[0.5em] mt-0 block text-[0.85em]">
        {formatDateRangeWithDuration(startDate, endDate)}
      </p>
      <p className="my-[0.5em] mb-0 leading-[1.3em]">{summary}</p>
      {renderHighlights(highlights)}
    </article>
  );
}

function renderProgressionEntry(entry: ResumeWorkEntry) {
  return (
    <article
      data-testid="work-progression-entry"
      className={joinClassNames('mb-4.5 last:mb-0', getPrintClassNames(entry))}
      key={`${entry.company}-${entry.position}-${entry.startDate}`}
    >
      <h4 className="mb-0 mt-2.5 flex flex-wrap items-baseline gap-1 font-medium leading-[1.3] text-(--color-primary)">
        {entry.position}
      </h4>
      <p className="my-[0.5em] mt-0 block text-[0.85em]">
        {formatDateRangeWithDuration(entry.startDate, entry.endDate)}
      </p>
      <p className="my-[0.5em] mb-0 leading-[1.3em]">
        {entry.summary}
      </p>
      {renderHighlights(entry.highlights)}
    </article>
  );
}

function renderProgressionGroup(item: ResumeWorkGroup, className?: string) {
  const progression = item.progression || [];
  const companyName = item.company || progression[0]?.company || '';
  const { endDate, startDate } = getProgressionBounds(progression);

  return (
    <article
      data-testid="work-progression-group"
      className={joinClassNames('mb-5.5 mt-4.5', className)}
    >
      <header className="mb-2.5">
        <h3 className="m-0 font-medium leading-[1.3] text-(--color-secondary)">
          <span className="inline-flex items-baseline gap-1 whitespace-nowrap">
            <span>@</span>
            <span>{companyName}</span>
          </span>
        </h3>
        {startDate ? (
          <p className="m-0 text-[0.85em]">
            {formatDateRangeWithDuration(startDate, endDate)}
          </p>
        ) : null}
      </header>
      <div className="ml-0.5 border-l border-l-(--color-main-border) pl-3.5">
        {progression.map(renderProgressionEntry)}
      </div>
    </article>
  );
}

function isProgressionGroup(item: ResumeWorkItem): item is ResumeWorkGroup {
  return Array.isArray((item as ResumeWorkGroup).progression);
}

function WorkExperienceItem({ className, item }: WorkExperienceItemProps) {
  if (isProgressionGroup(item)) {
    return renderProgressionGroup(item, className);
  }

  return renderSingleWorkItem(item, className);
}

export default WorkExperienceItem;
