import { Button } from '@mr-booking/shared-ui';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';

export interface BookingsEmptyStateProps {
  readonly icon: LucideIcon;
  readonly title: string;
  readonly description: string;
  readonly action?: {
    readonly href: string;
    readonly label: string;
  };
}

export function BookingsEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: BookingsEmptyStateProps) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center px-5 py-10 text-center sm:px-8">
      <span
        aria-hidden="true"
        className="mb-5 grid size-12 place-items-center rounded-full bg-accent text-accent-foreground"
      >
        <Icon className="size-6" />
      </span>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {action ? (
        <Button asChild className="mt-6">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      ) : null}
    </div>
  );
}
