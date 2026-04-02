import type {
  ResumeRuntimeData,
  ResumeWorkEntry,
  ResumeWorkGroup,
  ResumeWorkItem,
} from '../../data/types/resume';

function isResumeWorkGroup(item: ResumeWorkItem): item is ResumeWorkGroup {
  return Array.isArray((item as ResumeWorkGroup).progression);
}

function flattenGroupedWorkItem(item: ResumeWorkGroup): ResumeWorkEntry[] {
  return item.progression.map((entry, index) => ({
    ...entry,
    avoidPageBreakInside: entry.avoidPageBreakInside ?? item.avoidPageBreakInside,
    company: entry.company || item.company || '',
    printBreakBefore:
      entry.printBreakBefore ?? (index === 0 ? item.printBreakBefore : undefined),
    website: entry.website || item.website,
  }));
}

function flattenWorkItems(work: ResumeWorkItem[] | undefined) {
  if (!work) {
    return undefined;
  }

  return work.flatMap((item) => (isResumeWorkGroup(item) ? flattenGroupedWorkItem(item) : item));
}

export function toAtsPdfResumeData<T extends ResumeRuntimeData>(data: T): T {
  if (data.mode === 'manual') {
    return data;
  }

  return {
    ...data,
    work: flattenWorkItems(data.work),
  } as T;
}
