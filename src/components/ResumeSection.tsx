import type { ReactNode } from 'react';

import Section from './Layout/Section';
import { getItemPrintClassNames, joinClassNames } from '../helpers/print';
import type { PrintConfig } from '../data/types/resume';

type ResumeSectionItem = PrintConfig | string | null | undefined;

interface ResumeSectionCommonProps {
  className?: string;
  title?: string;
}

interface ResumeSectionTextProps extends ResumeSectionCommonProps {
  children: ReactNode;
  items?: undefined;
}

export interface ResumeSectionRenderArgs<TItem extends ResumeSectionItem> {
  getItemClassName: (item: TItem, index: number) => string;
  items: TItem[];
}

interface ResumeSectionListProps<TItem extends ResumeSectionItem>
  extends ResumeSectionCommonProps {
  children: (args: ResumeSectionRenderArgs<TItem>) => ReactNode;
  items: TItem[];
}

type ResumeSectionProps<TItem extends ResumeSectionItem = never> =
  | ResumeSectionTextProps
  | ResumeSectionListProps<TItem>;

function isResumeSectionListProps<TItem extends ResumeSectionItem>(
  props: ResumeSectionProps<TItem>
): props is ResumeSectionListProps<TItem> {
  return 'items' in props;
}

function getSectionPrintBreakClassName(items: ResumeSectionItem[] = []) {
  const firstItem = items[0];

  if (!firstItem || typeof firstItem === 'string') {
    return '';
  }

  return firstItem.printBreakBefore === 'page' ? 'PrintBreakBeforePage' : '';
}

function getResumeSectionItemClassName<TItem extends ResumeSectionItem>(
  item: TItem,
  index: number
) {
  if (!item || typeof item === 'string') {
    return '';
  }

  return getItemPrintClassNames(item, {
    ignorePageBreakBefore: index === 0,
  });
}

function getResumeSectionTestId(title?: string) {
  if (!title) {
    return 'resume-section';
  }

  return `resume-section-${title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')}`;
}

function ResumeSection<TItem extends ResumeSectionItem = never>(
  props: ResumeSectionProps<TItem>
) {
  const isListMode = isResumeSectionListProps(props);
  const sectionClassName = joinClassNames(
    isListMode ? getSectionPrintBreakClassName(props.items) : '',
    props.className
  );
  const bodyContent = isListMode
    ? props.children({
        getItemClassName: (item: TItem, index: number) =>
          getResumeSectionItemClassName(item, index),
        items: props.items,
      })
    : props.children;

  return (
    <Section
      className={sectionClassName}
      data-testid={getResumeSectionTestId(props.title)}
    >
      {props.title ? <Section.Title>{props.title}</Section.Title> : null}
      <Section.Body>{bodyContent}</Section.Body>
    </Section>
  );
}

export default ResumeSection;
