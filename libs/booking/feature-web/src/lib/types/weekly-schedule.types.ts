import type {
  CreateBookingInput,
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
import type { ReactNode } from 'react';

export type ScheduleMessages = AppDictionary['schedule'];

export interface WeeklyScheduleProps {
  readonly locale: Locale;
  readonly messages: ScheduleMessages;
}

export interface BookingSelection {
  readonly slot: ScheduleSlot;
}

export interface CreateBookingMutationOptions {
  readonly arg: CreateBookingInput;
}

export interface CancelBookingMutationOptions {
  readonly arg: string;
}

export interface RoomSelectorProps {
  readonly messages: ScheduleMessages;
  readonly rooms: readonly Room[];
  readonly room: Room | undefined;
  readonly loading: boolean;
  readonly onChange: (roomId: string) => void;
}

export interface ExpandedToolbarProps {
  readonly locale: Locale;
  readonly messages: ScheduleMessages;
  readonly rooms: readonly Room[];
  readonly room: Room | undefined;
  readonly schedule: ScheduleRange;
  readonly loadingRooms: boolean;
  readonly onRoomChange: (roomId: string) => void;
  readonly onPrevious: () => void;
  readonly onCurrent: () => void;
  readonly onNext: () => void;
}

export interface CompactContextProps {
  readonly locale: Locale;
  readonly messages: ScheduleMessages;
  readonly rooms: readonly Room[];
  readonly room: Room | undefined;
  readonly selectedDate: CalendarDate;
  readonly now: number;
  readonly browserTimeZone: string;
  readonly loadingRooms: boolean;
  readonly onRoomChange: (roomId: string) => void;
  readonly onPrevious: () => void;
  readonly onCurrent: () => void;
  readonly onNext: () => void;
  readonly onOpenCalendar: () => void;
  readonly onSelectDate: (date: CalendarDate) => void;
}

export interface WeekDateStripProps {
  readonly locale: Locale;
  readonly messages: ScheduleMessages;
  readonly selectedDate: CalendarDate;
  readonly now: number;
  readonly browserTimeZone: string;
  readonly onSelect: (date: CalendarDate) => void;
}

export interface SelectedDayHeadingProps {
  readonly locale: Locale;
  readonly messages: ScheduleMessages;
  readonly selectedDate: CalendarDate;
  readonly browserTimeZone: string;
}

export interface TimeZoneSummaryProps {
  readonly messages: ScheduleMessages;
  readonly browserTimeZone: string;
}

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
  readonly date: CalendarDate;
  readonly browserTimeZone: string;
  readonly slots: readonly ScheduleSlot[];
  readonly bookings: readonly ScheduleBooking[];
  readonly rowCount: number;
  readonly rowHeightRem: number;
  readonly now: number;
  readonly messages: ScheduleMessages;
  readonly timeFormatter: Intl.DateTimeFormat;
  readonly firstFocusable: string | undefined;
  readonly compact: boolean;
  readonly onSelectSlot: (slot: ScheduleSlot) => void;
  readonly onSelectBooking: (booking: ScheduleBooking) => void;
}

export interface ScheduleDatePickerProps {
  readonly locale: Locale;
  readonly messages: ScheduleMessages;
  readonly open: boolean;
  readonly selectedDate: CalendarDate;
  readonly now: number;
  readonly browserTimeZone: string;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSelect: (date: CalendarDate) => void;
}

export interface CreateBookingDialogProps {
  readonly locale: Locale;
  readonly messages: ScheduleMessages;
  readonly room: Room;
  readonly selection: BookingSelection | undefined;
  readonly slots: readonly ScheduleSlot[];
  readonly bookings: readonly ScheduleBooking[];
  readonly browserTimeZone: string;
  readonly onOpenChange: (open: boolean) => void;
  readonly onCreated: () => Promise<void>;
  readonly onConflict: () => Promise<void>;
}

export interface BookingDetailsDialogProps {
  readonly locale: Locale;
  readonly messages: ScheduleMessages;
  readonly booking: ScheduleBooking | undefined;
  readonly room: Room | undefined;
  readonly now: number;
  readonly browserTimeZone: string;
  readonly onOpenChange: (open: boolean) => void;
  readonly onCancelled: () => Promise<void>;
}

export interface IconButtonProps {
  readonly label: string;
  readonly onClick: () => void;
  readonly children: ReactNode;
}

export interface DetailProps {
  readonly label: string;
  readonly value: string;
}

export interface ScheduleLoadingProps {
  readonly presentation: SchedulePresentation | undefined;
  readonly message: string;
}

export interface ScheduleErrorStateProps {
  readonly message: string;
  readonly retry: string;
  readonly onRetry: () => void;
}

export interface ScheduleEmptyStateProps {
  readonly message: string;
}
