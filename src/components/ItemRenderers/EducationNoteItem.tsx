import type { EducationNote } from '../../data/types/resume';

interface EducationNoteItemProps {
  className?: string;
  item: EducationNote;
}

function EducationNoteItem({ className, item }: EducationNoteItemProps) {
  return (
    <div
      data-testid="education-note-item"
      className={className || undefined}
    >
      <h3 className="mb-0 block font-light leading-[1.3] text-(--color-secondary)">
        {item.title}
      </h3>
      <p className="my-[0.5em] mb-0 text-[0.9em] leading-[1.3em]">
        {item.summary}
      </p>
    </div>
  );
}

export default EducationNoteItem;
