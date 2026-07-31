import { DEMO_USER_IDS } from '@mr-booking/auth-domain';
import {
  getOfficeDateTimeParts,
  officeDateTimeToUtcInstant,
} from '@mr-booking/booking-domain';
import { DEMO_ROOM_IDS } from '@mr-booking/rooms-domain';
import {
  DEMO_BOOKING_IDS,
  demoBookingDefinitions,
} from './demo-booking-definitions';
import {
  DemoBookingSeedConfigurationError,
  createDemoBookingSeedPlan,
  resolveDemoSeedWeekStart,
} from './demo-booking-seed-plan';
import type {
  DemoBookingDefinition,
  DemoBookingSeedBookingRecord,
} from './types/demo-booking-seed.types';

describe('demo seed week resolution', () => {
  it('accepts a configured real Monday', () => {
    expect(resolveDemoSeedWeekStart('2030-06-03', 0)).toEqual({
      year: 2030,
      month: 6,
      day: 3,
    });
  });

  it.each(['2030/06/03', '2030-02-30', '2030-06-04'])(
    'rejects invalid configured date %s with one stable error',
    (value) => {
      expect(() => resolveDemoSeedWeekStart(value, 0)).toThrow(
        expect.objectContaining({
          code: 'DEMO_SEED_INVALID_WEEK_START',
          message:
            'DEMO_SEED_WEEK_START must be a valid Monday in YYYY-MM-DD format',
        }),
      );
    },
  );

  it('derives the next Monday when configuration is absent', () => {
    expect(
      resolveDemoSeedWeekStart(
        undefined,
        Date.parse('2026-07-30T12:00:00.000Z'),
      ),
    ).toEqual({ year: 2026, month: 8, day: 3 });
  });

  it('advances a current office-local Monday to the following week', () => {
    expect(
      resolveDemoSeedWeekStart(
        undefined,
        Date.parse('2026-08-03T08:00:00.000Z'),
      ),
    ).toEqual({ year: 2026, month: 8, day: 10 });
  });

  it('crosses a year boundary correctly', () => {
    expect(
      resolveDemoSeedWeekStart(
        undefined,
        Date.parse('2026-12-31T12:00:00.000Z'),
      ),
    ).toEqual({ year: 2027, month: 1, day: 4 });
  });

  it('uses the office-local date when UTC is still on the prior day', () => {
    expect(
      resolveDemoSeedWeekStart(
        undefined,
        Date.parse('2026-08-02T21:30:00.000Z'),
      ),
    ).toEqual({ year: 2026, month: 8, day: 10 });
  });
});

describe('demo booking seed plan', () => {
  const weekStart = { year: 2030, month: 6, day: 3 } as const;
  const validationNowUtc = Date.parse('2029-01-01T00:00:00.000Z');

  it('builds the expected named bookings and 30-minute slots', () => {
    const plan = createDemoBookingSeedPlan({
      definitions: demoBookingDefinitions,
      weekStart,
      validationNowUtc,
      toUtcInstant: officeDateTimeToUtcInstant,
    });

    expect(plan.summary).toEqual({
      weekStart: '2030-06-03',
      bookingCount: 6,
      slotCount: 15,
    });
    expect(plan.bookings.map(({ id }) => id)).toEqual([
      DEMO_BOOKING_IDS.alicePlanning,
      DEMO_BOOKING_IDS.bobStandup,
      DEMO_BOOKING_IDS.aliceDesignReview,
      DEMO_BOOKING_IDS.bobCustomerCall,
      DEMO_BOOKING_IDS.aliceRetrospective,
      DEMO_BOOKING_IDS.bobWeeklySync,
    ]);
    expect(
      plan.bookings.map(({ roomId, authorUserId }) => ({
        roomId,
        authorUserId,
      })),
    ).toEqual([
      {
        roomId: DEMO_ROOM_IDS.aquarium,
        authorUserId: DEMO_USER_IDS.alice,
      },
      {
        roomId: DEMO_ROOM_IDS.aquarium,
        authorUserId: DEMO_USER_IDS.bob,
      },
      { roomId: DEMO_ROOM_IDS.mars, authorUserId: DEMO_USER_IDS.alice },
      {
        roomId: DEMO_ROOM_IDS.aquarium,
        authorUserId: DEMO_USER_IDS.bob,
      },
      { roomId: DEMO_ROOM_IDS.mars, authorUserId: DEMO_USER_IDS.alice },
      {
        roomId: DEMO_ROOM_IDS.aquarium,
        authorUserId: DEMO_USER_IDS.bob,
      },
    ]);

    for (const booking of plan.bookings) {
      const bookingSlots = plan.bookingSlots.filter(
        ({ bookingId }) => bookingId === booking.id,
      );
      expect(bookingSlots).toHaveLength(
        (booking.endsAtUtc - booking.startsAtUtc) / (30 * 60 * 1_000),
      );
      expect(
        bookingSlots.every(
          ({ slotStartsAtUtc }, index) =>
            slotStartsAtUtc === booking.startsAtUtc + index * 30 * 60 * 1_000,
        ),
      ).toBe(true);
    }

    const planning = requiredBooking(
      plan.bookings,
      DEMO_BOOKING_IDS.alicePlanning,
    );
    const standup = requiredBooking(plan.bookings, DEMO_BOOKING_IDS.bobStandup);
    expect(planning.endsAtUtc).toBe(standup.startsAtUtc);
    expect(getOfficeDateTimeParts(planning.startsAtUtc)).toMatchObject({
      year: 2030,
      month: 6,
      day: 3,
      hour: 10,
      minute: 0,
    });
    expect(
      getOfficeDateTimeParts(
        requiredBooking(plan.bookings, DEMO_BOOKING_IDS.aliceDesignReview)
          .startsAtUtc,
      ),
    ).toMatchObject({ year: 2030, month: 6, day: 4 });
  });

  it('normalizes titles and keeps creation time independent from validation time', () => {
    const definition: DemoBookingDefinition = {
      ...requiredDefinition(DEMO_BOOKING_IDS.alicePlanning),
      title: '  Weekly planning  ',
    };
    const plan = createDemoBookingSeedPlan({
      definitions: [definition],
      weekStart,
      validationNowUtc,
      toUtcInstant: officeDateTimeToUtcInstant,
    });
    const booking = requiredBooking(
      plan.bookings,
      DEMO_BOOKING_IDS.alicePlanning,
    );

    expect(booking.title).toBe('Weekly planning');
    expect(booking.createdAtUtc).toBe(Date.parse('2030-06-02T09:00:00.000Z'));
    expect(booking.createdAtUtc).not.toBe(validationNowUtc);
    expect(booking.createdAtUtc).toBeLessThan(booking.startsAtUtc);
  });

  it('rejects a configured week whose bookings are not future', () => {
    expect(() =>
      createDemoBookingSeedPlan({
        definitions: demoBookingDefinitions,
        weekStart,
        validationNowUtc: Date.parse('2030-06-03T07:00:00.000Z'),
        toUtcInstant: officeDateTimeToUtcInstant,
      }),
    ).toThrow(
      expect.objectContaining({
        code: 'DEMO_SEED_WEEK_NOT_FUTURE',
      }),
    );
  });

  it('uses the injected validation time rather than persisted creation time', () => {
    expect(() =>
      createDemoBookingSeedPlan({
        definitions: [requiredDefinition(DEMO_BOOKING_IDS.alicePlanning)],
        weekStart,
        validationNowUtc: Date.parse('2030-06-03T07:00:00.000Z'),
        toUtcInstant: officeDateTimeToUtcInstant,
      }),
    ).toThrow(DemoBookingSeedConfigurationError);
  });

  it('constructs valid office bookings during a DST transition week', () => {
    const definition: DemoBookingDefinition = {
      ...requiredDefinition(DEMO_BOOKING_IDS.alicePlanning),
      id: 'dst-demo',
      dayOffset: 6,
      startHour: 9,
      durationMinutes: 60,
    };
    const plan = createDemoBookingSeedPlan({
      definitions: [definition],
      weekStart: { year: 2030, month: 3, day: 25 },
      validationNowUtc,
      toUtcInstant: officeDateTimeToUtcInstant,
    });

    expect(
      getOfficeDateTimeParts(
        requiredBooking(plan.bookings, definition.id).startsAtUtc,
      ),
    ).toMatchObject({
      year: 2030,
      month: 3,
      day: 31,
      hour: 9,
      minute: 0,
    });
    expect(plan.bookingSlots).toHaveLength(2);
  });
});

function requiredDefinition(id: string): DemoBookingDefinition {
  const definition = demoBookingDefinitions.find(
    (candidateDefinition) => candidateDefinition.id === id,
  );

  if (!definition) {
    throw new Error(`Missing demo definition ${id}`);
  }

  return definition;
}

function requiredBooking(
  records: readonly DemoBookingSeedBookingRecord[],
  id: string,
): DemoBookingSeedBookingRecord {
  const booking = records.find((record) => record.id === id);

  if (!booking) {
    throw new Error(`Missing planned demo booking ${id}`);
  }

  return booking;
}
