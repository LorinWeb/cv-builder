import type { SkillCategory } from '../../data/types/resume';
import { ResumeMarkdown } from '../../helpers/resume-markdown';
import { getTextValueSource } from '../../helpers/text-value';

interface SkillCategoryItemProps {
  className?: string;
  item: SkillCategory;
}

function SkillCategoryItem({ className, item }: SkillCategoryItemProps) {
  return (
    <div data-testid="skill-category-item" className={className || undefined}>
      <h3 className="m-0 font-light text-(--color-section-subtitle)">
        {item.name}
      </h3>
      <ul className="mb-2.5 mt-0 list-square pl-5">
        {item.keywords.map((keyword, index) => (
          <li key={index} className="font-light">
            <ResumeMarkdown markdown={getTextValueSource(keyword)} mode="inline" />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SkillCategoryItem;
