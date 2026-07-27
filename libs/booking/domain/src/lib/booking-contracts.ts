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
