import type { TextValue } from '../../data/types/resume';
import { ResumeMarkdown } from '../../helpers/resume-markdown';
import { getTextValueSource } from '../../helpers/text-value';

interface AchievementItemProps {
  className?: string;
  item: TextValue;
}

function AchievementItem({ className, item }: AchievementItemProps) {
  return (
    <li data-testid="achievement-item" className={className || undefined}>
      <ResumeMarkdown markdown={getTextValueSource(item)} mode="inline" />
    </li>
  );
}

export default AchievementItem;
