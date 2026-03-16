import type { PrintConfig } from '../data/types/resume';

export const getPrintClassNames = (config: PrintConfig = {}) => {
  const classes = [];

  if (config.printBreakBefore === 'page') {
    classes.push('PrintBreakBeforePage');
  }

  if (config.avoidPageBreakInside) {
    classes.push('PrintAvoidBreakInside');
  }

  return classes.join(' ');
};

export const getItemPrintClassNames = (
  config: PrintConfig = {},
  options: { ignorePageBreakBefore?: boolean } = {}
) => {
  if (!options.ignorePageBreakBefore) {
    return getPrintClassNames(config);
  }

  return getPrintClassNames({
    ...config,
    printBreakBefore: undefined,
  });
};
