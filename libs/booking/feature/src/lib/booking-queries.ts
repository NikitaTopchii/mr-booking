export class GetRoomsQuery {}

export class GetRoomScheduleQuery {
  public constructor(
    public readonly authenticatedUserId: string,
    public readonly roomId: string,
    public readonly fromUtc: number,
    public readonly toUtc: number,
  ) {}
}
