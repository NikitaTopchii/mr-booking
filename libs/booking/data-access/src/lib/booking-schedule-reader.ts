import {
  type BookingScheduleReader,
  type BookingScheduleRecord,
} from '@mr-booking/booking-domain';
import { users } from '@mr-booking/auth-infrastructure';
import { and, asc, eq, gt, isNull, lt } from 'drizzle-orm';
import { bookings } from './booking-schema';
import type { DatabaseConnectionProvider } from './types/booking-repository.types';

export class DrizzleBookingScheduleReader implements BookingScheduleReader {
  public constructor(
    private readonly databaseService: DatabaseConnectionProvider,
  ) {}

  public findActiveOverlappingRoomBookings(
    roomId: string,
    fromUtc: number,
    toUtc: number,
  ): readonly BookingScheduleRecord[] {
    return this.databaseService.connection.drizzle
      .select({
        id: bookings.id,
        roomId: bookings.roomId,
        title: bookings.title,
        startsAtUtc: bookings.startsAtUtc,
        endsAtUtc: bookings.endsAtUtc,
        authorId: users.id,
        authorName: users.name,
      })
      .from(bookings)
      .innerJoin(users, eq(bookings.authorUserId, users.id))
      .where(
        and(
          eq(bookings.roomId, roomId),
          isNull(bookings.cancelledAtUtc),
          lt(bookings.startsAtUtc, toUtc),
          gt(bookings.endsAtUtc, fromUtc),
        ),
      )
      .orderBy(
        asc(bookings.startsAtUtc),
        asc(bookings.endsAtUtc),
        asc(bookings.id),
      )
      .all()
      .map((record) => ({
        id: record.id,
        roomId: record.roomId,
        title: record.title,
        startsAtUtc: record.startsAtUtc,
        endsAtUtc: record.endsAtUtc,
        author: { id: record.authorId, name: record.authorName },
      }));
  }
}
