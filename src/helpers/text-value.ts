import type { TextValue } from '../data/types/resume';

export function getTextValue(item: TextValue) {
  return typeof item === 'string' ? item : item.text;
}
