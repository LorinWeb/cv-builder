import { createContext, useContext } from 'react';

export const PageHeaderStateContext = createContext({
  isStickyClone: false,
});

export function usePageHeaderState() {
  return useContext(PageHeaderStateContext);
}
