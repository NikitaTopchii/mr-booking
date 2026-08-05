import type { ScheduleBooking } from '@mr-booking/booking-data-access-web';
import type {
  CalendarDate,
  SchedulePresentation,
  ScheduleRange,
  ScheduleSlot,
} from '@mr-booking/booking-ui';
import type { Locale } from '@mr-booking/shared-i18n';
import type { ScheduleMessages } from './schedule-feature.types';
import type { ScheduleDayViewModel } from '../model/create-schedule-view-model';

export interface ScheduleGridProps {
  readonly locale: Locale;
  readonly messages: ScheduleMessages;
  readonly schedule: ScheduleRange;
  readonly presentation: SchedulePresentation;
  readonly bookings: readonly ScheduleBooking[];
  readonly now: number;
  readonly browserTimeZone: string;
  readonly revalidating: boolean;
  readonly selectedDate: CalendarDate;
  readonly onSelectSlot: (slot: ScheduleSlot) => void;
  readonly onSelectBooking: (booking: ScheduleBooking) => void;
}

export interface ScheduleDayProps {
  readonly locale: Locale;
  readonly day: ScheduleDayViewModel;
  readonly dayIndex: number;
  readonly rowCount: number;
  readonly rowHeightRem: number;
  readonly messages: ScheduleMessages;
  readonly timeFormatter: Intl.DateTimeFormat;
  readonly firstFocusable: string | undefined;
  readonly compact: boolean;
  readonly occupiedBySlotId: ReadonlyMap<string, ScheduleBooking>;
  readonly onSelectSlot: (slot: ScheduleSlot) => void;
  readonly onSelectBooking: (booking: ScheduleBooking) => void;
}
