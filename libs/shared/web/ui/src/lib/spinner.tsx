import { LoaderCircle } from 'lucide-react';
import type { ComponentProps } from 'react';
import { cn } from './styles';

export function Spinner({
  className,
  ...props
}: ComponentProps<typeof LoaderCircle>) {
  return (
    <LoaderCircle
      aria-hidden="true"
      className={cn('animate-spin motion-reduce:animate-none', className)}
      {...props}
    />
  );
}
