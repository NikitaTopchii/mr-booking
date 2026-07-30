import { Inject } from '@nestjs/common';
import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import {
  BOOKING_SCHEDULE_READER,
  RoomNotFoundError,
  ScheduleRangeValidationError,
  type BookingScheduleReader,
  type ScheduleBooking,
} from '@mr-booking/booking-domain';
import {
  ROOM_READER,
  type Room,
  type RoomReader,
} from '@mr-booking/rooms-domain';
import { GetRoomsQuery, GetRoomScheduleQuery } from './booking-queries';

@QueryHandler(GetRoomsQuery)
export class GetRoomsHandler implements IQueryHandler<
  GetRoomsQuery,
  readonly Room[]
> {
  public constructor(
    @Inject(ROOM_READER)
    private readonly roomReader: RoomReader,
  ) {}

  public async execute(): Promise<readonly Room[]> {
    return this.roomReader.list();
  }
}

@QueryHandler(GetRoomScheduleQuery)
export class GetRoomScheduleHandler implements IQueryHandler<
  GetRoomScheduleQuery,
  readonly ScheduleBooking[]
> {
  public constructor(
    @Inject(ROOM_READER)
    private readonly roomReader: RoomReader,
    @Inject(BOOKING_SCHEDULE_READER)
    private readonly scheduleReader: BookingScheduleReader,
  ) {}

  public async execute(
    query: GetRoomScheduleQuery,
  ): Promise<readonly ScheduleBooking[]> {
    if (
      !Number.isSafeInteger(query.fromUtc) ||
      !Number.isSafeInteger(query.toUtc) ||
      !Number.isFinite(new Date(query.fromUtc).getTime()) ||
      !Number.isFinite(new Date(query.toUtc).getTime()) ||
      query.fromUtc >= query.toUtc
    ) {
      throw new ScheduleRangeValidationError();
    }

    if (!this.roomReader.exists(query.roomId)) {
      throw new RoomNotFoundError();
    }

    return this.scheduleReader
      .findActiveOverlappingRoomBookings(
        query.roomId,
        query.fromUtc,
        query.toUtc,
      )
      .map((booking) => ({
        ...booking,
        isMine: booking.author.id === query.authenticatedUserId,
      }));
  }
}
