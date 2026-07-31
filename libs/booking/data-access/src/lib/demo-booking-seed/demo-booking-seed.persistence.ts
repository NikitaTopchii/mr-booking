import type { DatabaseConnection } from '@mr-booking/shared-database';
import { inArray } from 'drizzle-orm';
import { bookingSlots, bookings } from '../booking-schema';
import { demoBookingIds } from './demo-booking-definitions';
import type { DemoBookingSeedPlan } from './types/demo-booking-seed.types';

export class DemoBookingSeedPersistenceError extends Error {
  public constructor(public readonly persistenceCause: unknown) {
    super('Unable to persist the deterministic demo booking seed');
    this.name = 'DemoBookingSeedPersistenceError';
  }
}

export function persistDemoBookingSeed(
  connection: DatabaseConnection,
  plan: DemoBookingSeedPlan,
): void {
  try {
    assertKnownDemoBookingPlan(plan);

    connection.withImmediateTransaction(() => {
      connection.drizzle
        .delete(bookingSlots)
        .where(inArray(bookingSlots.bookingId, demoBookingIds))
        .run();

      for (const booking of plan.bookings) {
        connection.drizzle
          .insert(bookings)
          .values(booking)
          .onConflictDoUpdate({
            target: bookings.id,
            set: {
              roomId: booking.roomId,
              authorUserId: booking.authorUserId,
              title: booking.title,
              startsAtUtc: booking.startsAtUtc,
              endsAtUtc: booking.endsAtUtc,
              createdAtUtc: booking.createdAtUtc,
              cancelledAtUtc: booking.cancelledAtUtc,
            },
          })
          .run();
      }

      if (plan.bookingSlots.length > 0) {
        connection.drizzle
          .insert(bookingSlots)
          .values([...plan.bookingSlots])
          .run();
      }
    });
  } catch (error) {
    if (error instanceof DemoBookingSeedPersistenceError) {
      throw error;
    }

    throw new DemoBookingSeedPersistenceError(error);
  }
}

function assertKnownDemoBookingPlan(plan: DemoBookingSeedPlan): void {
  const plannedIds = new Set(plan.bookings.map(({ id }) => id));

  if (
    plannedIds.size !== demoBookingIds.length ||
    demoBookingIds.some((id) => !plannedIds.has(id)) ||
    plan.bookingSlots.some(({ bookingId }) => !plannedIds.has(bookingId))
  ) {
    throw new DemoBookingSeedPersistenceError(
      new Error('Demo seed plan contains unknown booking IDs'),
    );
  }
}
