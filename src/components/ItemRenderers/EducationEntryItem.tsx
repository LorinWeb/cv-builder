import { formatDateRangeWithDuration } from '../../helpers/date-range';
import type { EducationItem } from '../../data/types/resume';

interface EducationEntryItemProps {
  className?: string;
  item: EducationItem;
}

function EducationEntryItem({ className, item }: EducationEntryItemProps) {
  return (
    <div
      data-testid="education-entry-item"
      className={className || undefined}
    >
      <h3 className="mb-0 block font-light leading-[1.3] text-(--color-secondary)">
        {item.studyType} {item.area}
      </h3>
      <p className="my-[0.5em] mt-0 block text-[0.85em]">
        {formatDateRangeWithDuration(item.startDate, item.endDate)}
      </p>
      <h4 className="mt-0 font-medium leading-[1.45rem] text-(--color-primary)">
        {item.institution}
      </h4>
    </div>
  );
}

export default EducationEntryItem;
