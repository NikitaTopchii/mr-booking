import type {
  Room,
  ScheduleBooking,
} from '@mr-booking/booking-data-access-web';
import type {
  CalendarDate,
  SchedulePresentation,
  ScheduleRange,
  ScheduleSlot,
} from '@mr-booking/booking-ui';
import type { AppDictionary, Locale } from '@mr-booking/shared-i18n';
import type {
  BookingCancellationFeatureError,
  BookingCreationFeatureError,
  RoomQueryFeatureError,
  ScheduleQueryFeatureError,
} from '../errors/schedule-error.types';

export type ScheduleMessages = AppDictionary['schedule'];

export interface WeeklyScheduleProps {
  readonly locale: Locale;
  readonly messages: ScheduleMessages;
  readonly emailVerified?: boolean;
  readonly onVerificationRequired?: () => void;
}

export interface ScheduleRoomSelectorProps {
  readonly messages: ScheduleMessages;
  readonly rooms: readonly Room[];
  readonly room: Room | undefined;
  readonly loading: boolean;
  readonly onChange: (roomId: string) => void;
}

export interface ScheduleNavigationState {
  readonly selectedDate: CalendarDate;
  readonly selectedDateKey: string;
  readonly selectedWeek: CalendarDate;
  readonly requestedRoomId: string | undefined;
  readonly selectDate: (date: CalendarDate) => void;
  readonly selectRoom: (roomId: string) => void;
  readonly goToPreviousWeek: () => void;
  readonly goToNextWeek: () => void;
  readonly goToToday: () => void;
  readonly openCalendar: () => void;
  readonly calendarOpen: boolean;
  readonly setCalendarOpen: (open: boolean) => void;
}

export interface ScheduleClockState {
  readonly nowUtc: number;
}

export interface ScheduleDataState {
  readonly presentation: SchedulePresentation | undefined;
  readonly rooms: readonly Room[];
  readonly selectedRoom: Room | undefined;
  readonly presentationRange: ScheduleRange | undefined;
  readonly bookings: readonly ScheduleBooking[];
  readonly isLoadingRooms: boolean;
  readonly isLoadingSchedule: boolean;
  readonly hasScheduleData: boolean;
  readonly isRevalidating: boolean;
  readonly roomsError: RoomQueryFeatureError | undefined;
  readonly scheduleError: ScheduleQueryFeatureError | undefined;
  readonly retryRooms: () => void;
  readonly retrySchedule: () => void;
  readonly revalidateSchedule: () => Promise<unknown>;
}

export interface BookingSelection {
  readonly slotId: string;
  readonly slot: ScheduleSlot;
}

export interface BookingCreationState {
  readonly selection: BookingSelection | undefined;
  readonly title: string;
  readonly endsAt: string;
  readonly endOptions: readonly string[];
  readonly pending: boolean;
  readonly reconciling: boolean;
  readonly error: BookingCreationFeatureError | undefined;
  readonly notice: 'created' | undefined;
  readonly openForSlot: (slot: ScheduleSlot) => void;
  readonly close: () => void;
  readonly setTitle: (title: string) => void;
  readonly setEnd: (endsAt: string) => void;
  readonly submit: () => void;
}

export interface BookingCancellationState {
  readonly booking: ScheduleBooking | undefined;
  readonly confirming: boolean;
  readonly canCancel: boolean;
  readonly pending: boolean;
  readonly error: BookingCancellationFeatureError | undefined;
  readonly notice: 'cancelled' | undefined;
  readonly openBooking: (booking: ScheduleBooking) => void;
  readonly closeBooking: () => void;
  readonly requestConfirmation: () => void;
  readonly dismissConfirmation: () => void;
  readonly confirmCancellation: () => void;
}

export interface WeeklyScheduleViewProps {
  readonly locale: Locale;
  readonly messages: ScheduleMessages;
  readonly browserTimeZone: string;
  readonly navigation: ScheduleNavigationState;
  readonly clock: ScheduleClockState;
  readonly data: ScheduleDataState;
  readonly creation: BookingCreationState;
  readonly cancellation: BookingCancellationState;
  readonly emailVerified?: boolean;
  readonly onVerificationRequired?: () => void;
}
