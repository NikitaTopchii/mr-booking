import { Inject } from '@nestjs/common';
import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import {
  BOOKING_SCHEDULE_READER,
  BOOKING_CLOCK,
  MY_BOOKINGS_READER,
  RoomNotFoundError,
  ScheduleRangeValidationError,
  type BookingScheduleReader,
  type BookingClock,
  type MyBooking,
  type MyBookingsReader,
  type MyBookingsResult,
  type MyPastBookingsResult,
  type ScheduleBooking,
} from '@mr-booking/booking-domain';
import {
  ROOM_READER,
  type Room,
  type RoomReader,
} from '@mr-booking/rooms-domain';
import {
  GetMyPastBookingsQuery,
  GetMyUpcomingBookingsQuery,
  GetRoomsQuery,
  GetRoomScheduleQuery,
} from './booking-queries';

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

@QueryHandler(GetMyUpcomingBookingsQuery)
export class GetMyUpcomingBookingsHandler implements IQueryHandler<
  GetMyUpcomingBookingsQuery,
  MyBookingsResult
> {
  public constructor(
    @Inject(MY_BOOKINGS_READER)
    private readonly myBookingsReader: MyBookingsReader,
    @Inject(BOOKING_CLOCK)
    private readonly clock: BookingClock,
  ) {}

  public async execute(
    query: GetMyUpcomingBookingsQuery,
  ): Promise<MyBookingsResult> {
    const serverNowUtc = this.clock.now();
    return {
      items: this.myBookingsReader
        .findUpcoming(query.authenticatedUserId, serverNowUtc)
        .map((booking) => classifyMyBooking(booking, serverNowUtc)),
      serverNowUtc,
    };
  }
}

@QueryHandler(GetMyPastBookingsQuery)
export class GetMyPastBookingsHandler implements IQueryHandler<
  GetMyPastBookingsQuery,
  MyPastBookingsResult
> {
  public constructor(
    @Inject(MY_BOOKINGS_READER)
    private readonly myBookingsReader: MyBookingsReader,
    @Inject(BOOKING_CLOCK)
    private readonly clock: BookingClock,
  ) {}

  public async execute(
    query: GetMyPastBookingsQuery,
  ): Promise<MyPastBookingsResult> {
    const serverNowUtc = this.clock.now();
    const records = this.myBookingsReader.findPast(
      query.authenticatedUserId,
      serverNowUtc,
      query.cursor,
      query.limit + 1,
    );
    const hasNextPage = records.length > query.limit;
    const items = records
      .slice(0, query.limit)
      .map((booking) => classifyMyBooking(booking, serverNowUtc));
    const last = items[items.length - 1];

    return {
      items,
      serverNowUtc,
      nextCursor:
        hasNextPage && last
          ? { startsAtUtc: last.startsAtUtc, bookingId: last.id }
          : null,
    };
  }
}

function classifyMyBooking(
  booking: {
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
  },
  serverNowUtc: number,
): MyBooking {
  if (booking.endsAtUtc <= serverNowUtc) {
    return { ...booking, status: 'PAST', canCancel: false };
  }

  if (booking.startsAtUtc <= serverNowUtc) {
    return { ...booking, status: 'IN_PROGRESS', canCancel: false };
  }

  return { ...booking, status: 'UPCOMING', canCancel: true };
}
