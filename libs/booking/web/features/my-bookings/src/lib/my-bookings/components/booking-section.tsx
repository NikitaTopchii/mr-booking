import type { BookingSectionProps } from '../types/my-bookings.types';

export function BookingSection({
  id,
  title,
  icon: Icon,
  count,
  children,
}: BookingSectionProps) {
  return (
    <section aria-labelledby={`${id}-title`}>
      <header className="flex items-center gap-2 border-b border-foreground pb-2">
        <h2
          id={`${id}-title`}
          className="flex items-center gap-2 text-lg font-semibold tracking-tight"
        >
          <Icon aria-hidden="true" className="size-5 text-primary" />
          {title}
        </h2>
        {count !== undefined ? (
          <span className="rounded-sm bg-muted px-1.5 py-0.5 text-sm font-medium tabular-nums text-muted-foreground">
            {count}
          </span>
        ) : null}
      </header>
      <div>{children}</div>
    </section>
  );
}
