import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';

const ResumeStudioStructuralSyncContext = createContext<() => void>(() => {});

export function ResumeStudioStructuralSyncProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: () => void;
}) {
  return createElement(
    ResumeStudioStructuralSyncContext.Provider,
    { value },
    children
  );
}

export function useResumeStudioStructuralSync() {
  return useContext(ResumeStudioStructuralSyncContext);
}

export function useResumeStudioFieldArrayStructuralSync(
  fields: Array<{ id: string }>
) {
  const scheduleStructuralSync = useResumeStudioStructuralSync();
  const fieldIds = fields.map((field) => field.id).join(',');
  const previousFieldIdsRef = useRef(fieldIds);

  useEffect(() => {
    if (previousFieldIdsRef.current === fieldIds) {
      return;
    }

    previousFieldIdsRef.current = fieldIds;
    scheduleStructuralSync();
  }, [fieldIds, scheduleStructuralSync]);
}
