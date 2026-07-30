import {
  BookingConflictError,
  DatabaseBusyError,
  type Booking,
  type BookingRepository,
  type BookingScheduleReader,
  type BookingScheduleRecord,
  type BookingWriteTransaction,
} from '@mr-booking/booking-domain';
import { users } from '@mr-booking/auth-infrastructure';
import { type DatabaseConnection } from '@mr-booking/shared-database';
import { and, asc, eq, gt, isNull, lt } from 'drizzle-orm';
import { bookingSlots, bookings, type BookingRecord } from './booking-schema';

interface DatabaseConnectionProvider {
  readonly connection: DatabaseConnection;
}

export class DrizzleBookingRepository implements BookingRepository {
  public constructor(
    private readonly databaseService: DatabaseConnectionProvider,
  ) {}

  public withImmediateTransaction<T>(
    operation: (transaction: BookingWriteTransaction) => T,
  ): T {
    try {
      return this.databaseService.connection.withImmediateTransaction(() =>
        operation(
          new DrizzleBookingWriteTransaction(this.databaseService.connection),
        ),
      );
    } catch (error) {
      if (isSqliteBusyFailure(error)) {
        throw new DatabaseBusyError();
      }

      throw error;
    }
  }
}

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
        author: {
          id: record.authorId,
          name: record.authorName,
        },
      }));
  }
}

class DrizzleBookingWriteTransaction implements BookingWriteTransaction {
  public constructor(private readonly connection: DatabaseConnection) {}

  public createBookingWithSlots(
    booking: Booking,
    slotStartsAtUtc: readonly number[],
  ): void {
    this.connection.drizzle.insert(bookings).values(booking).run();

    try {
      this.connection.drizzle
        .insert(bookingSlots)
        .values(
          slotStartsAtUtc.map((slotStartsAtUtcValue) => ({
            bookingId: booking.id,
            roomId: booking.roomId,
            slotStartsAtUtc: slotStartsAtUtcValue,
          })),
        )
        .run();
    } catch (error) {
      if (isRoomSlotConstraintFailure(error)) {
        throw new BookingConflictError();
      }

      throw error;
    }
  }

  public findBookingForCancellation(bookingId: string): Booking | null {
    const record = this.connection.drizzle
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .get();

    return record ? toBooking(record) : null;
  }

  public cancelBookingAndReleaseSlots(
    bookingId: string,
    cancelledAtUtc: number,
  ): void {
    this.connection.drizzle
      .update(bookings)
      .set({ cancelledAtUtc })
      .where(eq(bookings.id, bookingId))
      .run();
    this.connection.drizzle
      .delete(bookingSlots)
      .where(eq(bookingSlots.bookingId, bookingId))
      .run();
  }
}

function toBooking(record: BookingRecord): Booking {
  return {
    id: record.id,
    roomId: record.roomId,
    authorUserId: record.authorUserId,
    title: record.title,
    startsAtUtc: record.startsAtUtc,
    endsAtUtc: record.endsAtUtc,
    createdAtUtc: record.createdAtUtc,
    cancelledAtUtc: record.cancelledAtUtc,
  };
}

function isRoomSlotConstraintFailure(error: unknown): boolean {
  const details = sqliteErrorDetails(error);

  return (
    details !== null &&
    details.code.startsWith('SQLITE_CONSTRAINT') &&
    (details.message.includes(
      'booking_slots.room_id, booking_slots.slot_starts_at_utc',
    ) ||
      details.message.includes('booking_slots_room_slot_unique'))
  );
}

function isSqliteBusyFailure(error: unknown): boolean {
  const details = sqliteErrorDetails(error);
  return details !== null && details.code.startsWith('SQLITE_BUSY');
}

function sqliteErrorDetails(
  error: unknown,
): { readonly code: string; readonly message: string } | null {
  if (typeof error !== 'object' || error === null) {
    return null;
  }

  const code = 'code' in error ? error.code : undefined;
  const message = 'message' in error ? error.message : undefined;

  return typeof code === 'string' && typeof message === 'string'
    ? { code, message }
    : null;
}
