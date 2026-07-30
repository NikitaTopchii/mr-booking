import type { MyBooking } from '@mr-booking/booking-data-access-web';
import type { AppDictionary, Locale } from '@mr-booking/shared-i18n';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export type MyBookingsMessages = AppDictionary['myBookings'];

export interface MyBookingsProps {
  readonly locale: Locale;
  readonly messages: MyBookingsMessages;
}

export interface CancelBookingMutationOptions {
  readonly arg: string;
}

export interface BookingSectionProps {
  readonly id: string;
  readonly title: string;
  readonly icon: LucideIcon;
  readonly children: ReactNode;
}

export interface BookingListProps {
  readonly bookings: readonly MyBooking[];
  readonly locale: Locale;
  readonly browserTimeZone: string;
  readonly messages: MyBookingsMessages;
  readonly onCancel: (booking: MyBooking) => void;
}

export interface CancellationDialogProps {
  readonly booking: MyBooking | undefined;
  readonly locale: Locale;
  readonly browserTimeZone: string;
  readonly messages: MyBookingsMessages;
  readonly error: string | undefined;
  readonly pending: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onConfirm: () => void;
}

export interface MyBookingsLoadingStateProps {
  readonly message: string;
}

export interface MyBookingsErrorStateProps {
  readonly message: string;
  readonly retry: string;
  readonly onRetry: () => void;
}

export interface MyBookingsEmptyStateProps {
  readonly title: string;
  readonly description: string;
  readonly action?: { readonly href: string; readonly label: string };
}
