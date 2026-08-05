import { DialogContent } from '@mr-booking/shared-ui';
import type { ComponentProps } from 'react';

export function AdaptiveDialogContent(
  props: ComponentProps<typeof DialogContent>,
) {
  return (
    <DialogContent
      {...props}
      className={`max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:max-h-[90dvh] max-sm:w-full max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-b-none max-sm:pb-[max(1.5rem,env(safe-area-inset-bottom))] ${props.className ?? ''}`}
    />
  );
}
