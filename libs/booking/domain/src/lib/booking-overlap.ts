export interface RoomBookingInterval {
  readonly roomId: string;
  readonly startsAtUtc: number;
  readonly endsAtUtc: number;
}

export function bookingIntervalsOverlap(
  first: RoomBookingInterval,
  second: RoomBookingInterval,
): boolean {
  return (
    first.roomId === second.roomId &&
    first.startsAtUtc < second.endsAtUtc &&
    second.startsAtUtc < first.endsAtUtc
  );
}
