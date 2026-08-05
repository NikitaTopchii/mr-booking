import {
  type MyBookingRecord,
  type MyBookingsReader,
  type MyPastBookingsCursor,
} from '@mr-booking/booking-domain';
import { bookings } from '@mr-booking/booking-infrastructure/schema';
import { rooms } from '@mr-booking/rooms-infrastructure/schema';
import { and, asc, desc, eq, isNull, lt, lte, or, gt } from 'drizzle-orm';
import type { DatabaseConnectionProvider } from './types/booking-repository.types';

export class DrizzleMyBookingsReader implements MyBookingsReader {
  public constructor(
    private readonly databaseService: DatabaseConnectionProvider,
  ) {}

  public findUpcoming(
    authenticatedUserId: string,
    serverNowUtc: number,
  ): readonly MyBookingRecord[] {
    return this.selectMyBookings(
      and(
        eq(bookings.authorUserId, authenticatedUserId),
        isNull(bookings.cancelledAtUtc),
        gt(bookings.endsAtUtc, serverNowUtc),
      ),
      'ascending',
    );
  }

  public findPast(
    authenticatedUserId: string,
    serverNowUtc: number,
    cursor: MyPastBookingsCursor | null,
    requestedCount: number,
  ): readonly MyBookingRecord[] {
    const cursorCondition = cursor
      ? or(
          lt(bookings.startsAtUtc, cursor.startsAtUtc),
          and(
            eq(bookings.startsAtUtc, cursor.startsAtUtc),
            lt(bookings.id, cursor.bookingId),
          ),
        )
      : undefined;

    return this.selectMyBookings(
      and(
        eq(bookings.authorUserId, authenticatedUserId),
        isNull(bookings.cancelledAtUtc),
        lte(bookings.endsAtUtc, serverNowUtc),
        cursorCondition,
      ),
      'descending',
      requestedCount,
    );
  }

  private selectMyBookings(
    condition: ReturnType<typeof and>,
    order: 'ascending' | 'descending',
    limit?: number,
  ): readonly MyBookingRecord[] {
    const direction = order === 'ascending' ? asc : desc;
    const query = this.databaseService.connection.drizzle
      .select({
        id: bookings.id,
        title: bookings.title,
        startsAtUtc: bookings.startsAtUtc,
        endsAtUtc: bookings.endsAtUtc,
        roomId: rooms.id,
        roomName: rooms.name,
        roomFloor: rooms.floor,
        roomCapacity: rooms.capacity,
      })
      .from(bookings)
      .innerJoin(rooms, eq(bookings.roomId, rooms.id))
      .where(condition)
      .orderBy(direction(bookings.startsAtUtc), direction(bookings.id))
      .$dynamic();

    if (limit !== undefined) query.limit(limit);

    return query.all().map((record) => ({
      id: record.id,
      title: record.title,
      startsAtUtc: record.startsAtUtc,
      endsAtUtc: record.endsAtUtc,
      room: {
        id: record.roomId,
        name: record.roomName,
        floor: record.roomFloor,
        capacity: record.roomCapacity,
      },
    }));
  }
}
