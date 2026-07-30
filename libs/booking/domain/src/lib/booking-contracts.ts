export interface Booking {
  readonly id: string;
  readonly roomId: string;
  readonly authorUserId: string;
  readonly title: string;
  readonly startsAtUtc: number;
  readonly endsAtUtc: number;
  readonly createdAtUtc: number;
  readonly cancelledAtUtc: number | null;
}

export interface BookingScheduleRecord {
  readonly id: string;
  readonly roomId: string;
  readonly title: string;
  readonly startsAtUtc: number;
  readonly endsAtUtc: number;
  readonly author: {
    readonly id: string;
    readonly name: string;
  };
}

export interface ScheduleBooking extends BookingScheduleRecord {
  readonly isMine: boolean;
}

export interface MyBookingRecord {
  readonly id: string;
  readonly title: string;
  readonly startsAtUtc: number;
  readonly endsAtUtc: number;
  readonly room: {
    readonly id: string;
    readonly name: string;
    readonly floor: number;
    readonly capacity: number;
  };
}

export type MyBookingStatus = 'UPCOMING' | 'IN_PROGRESS' | 'PAST';

export interface MyBooking extends MyBookingRecord {
  readonly status: MyBookingStatus;
  readonly canCancel: boolean;
}

export interface MyPastBookingsCursor {
  readonly startsAtUtc: number;
  readonly bookingId: string;
}

export interface MyBookingsResult {
  readonly items: readonly MyBooking[];
  readonly serverNowUtc: number;
}

export interface MyPastBookingsResult extends MyBookingsResult {
  readonly nextCursor: MyPastBookingsCursor | null;
}
