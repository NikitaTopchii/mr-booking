import type { VariantProps } from 'class-variance-authority';
import type * as React from 'react';
import type { alertVariants } from '../alert-variants';

export interface AlertProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}
