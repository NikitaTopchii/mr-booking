import { Slot } from '@radix-ui/react-slot';
import * as React from 'react';
import { buttonVariants } from './button-variants';
import { cn } from './styles';
import type { ButtonProps } from './types/button.types';

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Component = asChild ? Slot : 'button';

    return (
      <Component
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { buttonVariants };
