import { formatDateRangeWithDuration } from '../../helpers/date-range';
import { ResumeMarkdown } from '../../helpers/resume-markdown';
import { getTextValueSource } from '../../helpers/text-value';
import type { EducationItem } from '../../data/types/resume';

interface EducationEntryItemProps {
  className?: string;
  item: EducationItem;
}

function EducationEntryItem({ className, item }: EducationEntryItemProps) {
  const courses = item.courses || [];

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
      {courses.length > 0 ? (
        <ul data-testid="education-courses" className="mb-0 mt-2 list-square pl-5">
          {courses.map((course, index) => (
            <li
              key={index}
              data-testid="education-course-item"
              className="font-light leading-[1.4em]"
            >
              <ResumeMarkdown markdown={getTextValueSource(course)} mode="inline" />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export default EducationEntryItem;
