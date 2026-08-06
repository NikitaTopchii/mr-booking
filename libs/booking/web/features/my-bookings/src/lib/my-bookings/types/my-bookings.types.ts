import type { MyBooking } from '@mr-booking/booking-data-access-web';
import type { AppDictionary, Locale } from '@mr-booking/shared-i18n';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export type MyBookingsMessages = AppDictionary['myBookings'];
export type MyBookingsQueryError = 'initial' | 'loadMore';
export type CancellationError =
  'unauthenticated' | 'stale' | 'notCancellable' | 'service';

export interface MyBookingsProps {
  readonly locale: Locale;
  readonly messages: MyBookingsMessages;
}

export interface MyUpcomingBookingsState {
  readonly items: readonly MyBooking[];
  readonly isLoading: boolean;
  readonly hasError: boolean;
  readonly retry: () => void;
  readonly revalidate: () => Promise<unknown>;
}

export interface MyPastBookingsState {
  readonly items: readonly MyBooking[];
  readonly isLoading: boolean;
  readonly isLoadingMore: boolean;
  readonly hasNextPage: boolean;
  readonly error: MyBookingsQueryError | undefined;
  readonly loadMore: () => void;
  readonly retry: () => void;
}

export interface BookingCancellationState {
  readonly booking: MyBooking | undefined;
  readonly error: CancellationError | undefined;
  readonly isPending: boolean;
  readonly wasCancelled: boolean;
  readonly request: (booking: MyBooking) => void;
  readonly dismiss: () => void;
  readonly confirm: () => void;
}

export interface MyBookingsViewProps extends MyBookingsProps {
  readonly browserTimeZone: string;
  readonly upcoming: MyUpcomingBookingsState;
  readonly past: MyPastBookingsState;
  readonly cancellation: BookingCancellationState;
}

export interface BookingSectionProps {
  readonly id: string;
  readonly title: string;
  readonly icon: LucideIcon;
  readonly count?: number;
  readonly children: ReactNode;
}

export interface BookingListProps {
  readonly bookings: readonly MyBooking[];
  readonly locale: Locale;
  readonly browserTimeZone: string;
  readonly messages: MyBookingsMessages;
  readonly onCancel?: (booking: MyBooking) => void;
}

export interface BookingListItemProps {
  readonly booking: MyBooking;
  readonly href: string;
  readonly locale: Locale;
  readonly browserTimeZone: string;
  readonly messages: MyBookingsMessages;
  readonly onCancel?: () => void;
}

export interface BookingSectionStateProps {
  readonly locale: Locale;
  readonly browserTimeZone: string;
  readonly messages: MyBookingsMessages;
}

export interface UpcomingBookingsSectionProps
  extends BookingSectionStateProps, MyUpcomingBookingsState {
  readonly onCancel: (booking: MyBooking) => void;
}

export interface PastBookingsSectionProps
  extends BookingSectionStateProps, MyPastBookingsState {}

export interface CancellationDialogProps {
  readonly booking: MyBooking | undefined;
  readonly locale: Locale;
  readonly browserTimeZone: string;
  readonly messages: MyBookingsMessages;
  readonly error: CancellationError | undefined;
  readonly pending: boolean;
  readonly onDismiss: () => void;
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
