export class CreateBookingCommand {
  public constructor(
    public readonly authorUserId: string,
    public readonly roomId: string,
    public readonly title: string,
    public readonly startsAtUtc: number,
    public readonly endsAtUtc: number,
  ) {}
}

export class CancelBookingCommand {
  public constructor(
    public readonly authenticatedUserId: string,
    public readonly bookingId: string,
  ) {}
}
