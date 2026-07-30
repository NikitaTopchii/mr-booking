export interface InsertBookingInput {
  readonly id: string;
  readonly authorUserId: string;
  readonly roomId: string;
  readonly title: string;
  readonly startsAtUtc: number;
  readonly endsAtUtc: number;
  readonly cancelledAtUtc?: number;
}
