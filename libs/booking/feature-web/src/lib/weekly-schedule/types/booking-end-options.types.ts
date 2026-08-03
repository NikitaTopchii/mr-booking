import type { ScheduleBooking } from '@mr-booking/booking-data-access-web';
import type { ScheduleSlot } from '@mr-booking/booking-ui';

export interface CreateBookingEndOptionsInput {
  readonly selectedSlot: ScheduleSlot;
  readonly slots: readonly ScheduleSlot[];
  readonly bookings: readonly ScheduleBooking[];
  readonly roomId: string;
  readonly maximumDurationSlots: number;
}
