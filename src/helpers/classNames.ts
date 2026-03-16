type ClassNameValue = string | false | null | undefined;

export function joinClassNames(...classNames: ClassNameValue[]) {
  return classNames.filter(Boolean).join(' ');
}
