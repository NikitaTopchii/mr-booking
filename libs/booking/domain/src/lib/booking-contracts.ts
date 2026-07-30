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
