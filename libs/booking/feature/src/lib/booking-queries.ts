export class GetRoomsQuery {}

export class GetRoomScheduleQuery {
  public constructor(
    public readonly authenticatedUserId: string,
    public readonly roomId: string,
    public readonly fromUtc: number,
    public readonly toUtc: number,
  ) {}
}

export class GetMyUpcomingBookingsQuery {
  public constructor(public readonly authenticatedUserId: string) {}
}

export class GetMyPastBookingsQuery {
  public constructor(
    public readonly authenticatedUserId: string,
    public readonly cursor: {
      readonly startsAtUtc: number;
      readonly bookingId: string;
    } | null,
    public readonly limit: number,
  ) {}
}
