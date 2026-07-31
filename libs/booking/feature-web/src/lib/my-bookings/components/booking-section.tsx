import { Card, CardContent, CardHeader } from '@mr-booking/shared-ui';
import type { BookingSectionProps } from '../types/my-bookings.types';

export function BookingSection({
  id,
  title,
  icon: Icon,
  children,
}: BookingSectionProps) {
  return (
    <Card aria-labelledby={`${id}-title`}>
      <CardHeader className="border-b border-border">
        <h2
          id={`${id}-title`}
          className="flex items-center gap-2 text-xl font-semibold tracking-tight"
        >
          <Icon aria-hidden="true" className="size-5" />
          {title}
        </h2>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">{children}</CardContent>
    </Card>
  );
}
