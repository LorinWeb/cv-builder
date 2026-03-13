import type { TextValue } from '../../data/types/resume';
import { getTextValue } from '../../helpers/text-value';

interface AchievementItemProps {
  className?: string;
  item: TextValue;
}

function AchievementItem({ className, item }: AchievementItemProps) {
  return (
    <li data-testid="achievement-item" className={className || undefined}>
      {getTextValue(item)}
    </li>
  );
}

export default AchievementItem;
