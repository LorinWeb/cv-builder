import { type ComponentPropsWithoutRef } from 'react';

import { joinClassNames } from '../../../helpers/classNames';

type PageProps = ComponentPropsWithoutRef<'div'>;

export function Page({ className, ...props }: PageProps) {
  return (
    <div
      data-testid="page"
      className={joinClassNames(
        'PageRoot relative z-10 mx-auto my-12.5 box-border h-auto min-h-[297mm] w-[210mm] max-w-[calc(100%-32px)] bg-white px-[10mm] py-[15mm] shadow-[1px_3px_8px_-1px_rgba(0,0,0,0.2)] print:m-0 print:h-auto print:min-h-0 print:w-auto print:max-w-none print:bg-transparent print:p-0 print:shadow-none',
        className
      )}
      {...props}
    />
  );
}

export default Page;
