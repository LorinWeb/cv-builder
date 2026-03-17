import type { TextValue } from '../data/types/resume';

export function getTextValueSource(item: TextValue) {
  return typeof item === 'string' ? item : item.text;
}
