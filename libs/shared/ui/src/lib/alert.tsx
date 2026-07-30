import * as React from 'react';
import { alertVariants } from './alert-variants';
import { cn } from './styles';
import type { AlertProps } from './types/alert.types';

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  ),
);
Alert.displayName = 'Alert';

export function AlertDescription({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('text-sm leading-5 [&_p]:leading-relaxed', className)}
      {...props}
    />
  );
}
