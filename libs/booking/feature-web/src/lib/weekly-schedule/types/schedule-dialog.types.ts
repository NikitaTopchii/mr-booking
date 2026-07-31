import type {
  Room,
  ScheduleBooking,
} from '@mr-booking/booking-data-access-web';
import type { Locale } from '@mr-booking/shared-i18n';
import type {
  BookingCreationState,
  ScheduleMessages,
} from './schedule-feature.types';

export interface ScheduleDialogBaseProps {
  readonly locale: Locale;
  readonly messages: ScheduleMessages;
  readonly browserTimeZone: string;
}

export interface BookingDetailsDialogProps extends ScheduleDialogBaseProps {
  readonly booking: ScheduleBooking | undefined;
  readonly room: Room | undefined;
  readonly confirming: boolean;
  readonly canCancel: boolean;
  readonly pending: boolean;
  readonly error: string | undefined;
  readonly onClose: () => void;
  readonly onRequestConfirmation: () => void;
  readonly onDismissConfirmation: () => void;
  readonly onConfirmCancellation: () => void;
}

export interface CreateBookingDialogProps extends ScheduleDialogBaseProps {
  readonly room: Room;
  readonly creation: BookingCreationState;
  readonly errorMessage: string | undefined;
}
