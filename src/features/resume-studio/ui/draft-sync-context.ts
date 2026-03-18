import { createContext, createElement, useContext, type ReactNode } from 'react';

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
