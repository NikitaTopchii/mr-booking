import {
  BookingCancellationForbiddenError,
  BookingConflictError,
  BookingNotCancellableError,
  BookingNotFoundError,
  BookingOutsideOfficeHoursError,
  BookingStartNotInFutureError,
  BookingTitleRequiredError,
  RoomNotFoundError,
  type Booking,
  type BookingClock,
  type BookingIdGenerator,
  type BookingRepository,
  type BookingWriteTransaction,
} from '@mr-booking/booking-domain';
import type { EmailVerificationStatusReader } from '@mr-booking/auth-domain';
import type { RoomReader } from '@mr-booking/rooms-domain';
import { CancelBookingCommand, CreateBookingCommand } from './booking-commands';
import { CancelBookingHandler, CreateBookingHandler } from './booking-handlers';

const futureStartUtc = Date.UTC(2026, 0, 10, 7);
const futureEndUtc = Date.UTC(2026, 0, 10, 8);

describe('booking command handlers', () => {
  let repository: InMemoryBookingRepository;
  let roomReader: TestRoomReader;
  let clock: MutableClock;
  let idGenerator: SequenceIdGenerator;
  let verificationStatusReader: TestVerificationStatusReader;

  beforeEach(() => {
    repository = new InMemoryBookingRepository();
    roomReader = new TestRoomReader();
    clock = new MutableClock(Date.UTC(2026, 0, 1));
    idGenerator = new SequenceIdGenerator();
    verificationStatusReader = new TestVerificationStatusReader();
  });

  it('rejects an unverified user before booking validation or persistence', async () => {
    verificationStatusReader.verified = false;

    await expect(
      createHandler().execute(validCreateCommand()),
    ).rejects.toMatchObject({ code: 'EMAIL_VERIFICATION_REQUIRED' });
    expect(idGenerator.generatedCount).toBe(0);
    expect(repository.transactionCount).toBe(0);
  });

  it('creates a normalized booking and all slots in one transaction', async () => {
    const result = await createHandler().execute(
      new CreateBookingCommand(
        'user-alice',
        'room-aquarium',
        '  Design   review  ',
        futureStartUtc,
        futureEndUtc,
      ),
    );

    expect(result).toEqual({
      id: 'booking-1',
      roomId: 'room-aquarium',
      authorUserId: 'user-alice',
      title: 'Design   review',
      startsAtUtc: futureStartUtc,
      endsAtUtc: futureEndUtc,
      createdAtUtc: clock.value,
      cancelledAtUtc: null,
    });
    expect(repository.transactionCount).toBe(1);
    expect(repository.slotStartsByBooking.get(result.id)).toEqual([
      futureStartUtc,
      futureStartUtc + 30 * 60 * 1000,
    ]);
  });

  it('rejects an unknown room before generating an ID or starting a write', async () => {
    roomReader.existingRoomIds.clear();

    await expect(
      createHandler().execute(validCreateCommand()),
    ).rejects.toBeInstanceOf(RoomNotFoundError);
    expect(idGenerator.generatedCount).toBe(0);
    expect(repository.transactionCount).toBe(0);
  });

  it('uses authoritative title validation', async () => {
    await expect(
      createHandler().execute(
        new CreateBookingCommand(
          'user-alice',
          'room-aquarium',
          '   ',
          futureStartUtc,
          futureEndUtc,
        ),
      ),
    ).rejects.toBeInstanceOf(BookingTitleRequiredError);
    expect(repository.transactionCount).toBe(0);
  });

  it('uses the server clock for strict future validation', async () => {
    clock.value = futureStartUtc;

    await expect(
      createHandler().execute(validCreateCommand()),
    ).rejects.toBeInstanceOf(BookingStartNotInFutureError);
  });

  it('enforces Kyiv office hours', async () => {
    await expect(
      createHandler().execute(
        new CreateBookingCommand(
          'user-alice',
          'room-aquarium',
          'Early',
          Date.UTC(2026, 0, 10, 6, 30),
          Date.UTC(2026, 0, 10, 7),
        ),
      ),
    ).rejects.toBeInstanceOf(BookingOutsideOfficeHoursError);
  });

  it('preserves a typed persistence conflict', async () => {
    repository.createError = new BookingConflictError();

    await expect(
      createHandler().execute(validCreateCommand()),
    ).rejects.toBeInstanceOf(BookingConflictError);
    expect(repository.bookings).toHaveLength(0);
  });

  it('lets the owner cancel and atomically releases all slots', async () => {
    const booking = await createHandler().execute(validCreateCommand());
    clock.value = Date.UTC(2026, 0, 5);

    const cancelled = await cancelHandler().execute(
      new CancelBookingCommand('user-alice', booking.id),
    );

    expect(cancelled.cancelledAtUtc).toBe(clock.value);
    expect(repository.bookings).toEqual([
      expect.objectContaining({
        id: booking.id,
        cancelledAtUtc: clock.value,
      }),
    ]);
    expect(repository.slotStartsByBooking.has(booking.id)).toBe(false);
    expect(repository.transactionCount).toBe(2);
  });

  it('rejects cancellation by another authenticated user', async () => {
    const booking = await createHandler().execute(validCreateCommand());

    await expect(
      cancelHandler().execute(new CancelBookingCommand('user-bob', booking.id)),
    ).rejects.toBeInstanceOf(BookingCancellationForbiddenError);
    expect(repository.slotStartsByBooking.has(booking.id)).toBe(true);
  });

  it.each([futureStartUtc, futureStartUtc + 1])(
    'rejects a newly requested cancellation at or after the start',
    async (serverNowUtc) => {
      const booking = await createHandler().execute(validCreateCommand());
      clock.value = serverNowUtc;

      await expect(
        cancelHandler().execute(
          new CancelBookingCommand('user-alice', booking.id),
        ),
      ).rejects.toBeInstanceOf(BookingNotCancellableError);
    },
  );

  it('returns not found for an unknown booking', async () => {
    await expect(
      cancelHandler().execute(
        new CancelBookingCommand('user-alice', 'missing'),
      ),
    ).rejects.toBeInstanceOf(BookingNotFoundError);
  });

  it('treats repeated owner cancellation as idempotent even after the original start', async () => {
    const booking = await createHandler().execute(validCreateCommand());
    clock.value = Date.UTC(2026, 0, 5);
    const firstResult = await cancelHandler().execute(
      new CancelBookingCommand('user-alice', booking.id),
    );
    clock.value = futureStartUtc + 1;

    const repeatedResult = await cancelHandler().execute(
      new CancelBookingCommand('user-alice', booking.id),
    );

    expect(repeatedResult).toEqual(firstResult);
    expect(repository.cancelCount).toBe(1);
  });

  function createHandler(): CreateBookingHandler {
    return new CreateBookingHandler(
      repository,
      roomReader,
      clock,
      idGenerator,
      verificationStatusReader,
    );
  }

  function cancelHandler(): CancelBookingHandler {
    return new CancelBookingHandler(repository, clock);
  }
});

function validCreateCommand(): CreateBookingCommand {
  return new CreateBookingCommand(
    'user-alice',
    'room-aquarium',
    'Planning',
    futureStartUtc,
    futureEndUtc,
  );
}

class InMemoryBookingRepository
  implements BookingRepository, BookingWriteTransaction
{
  public bookings: Booking[] = [];
  public readonly slotStartsByBooking = new Map<string, readonly number[]>();
  public transactionCount = 0;
  public cancelCount = 0;
  public createError: Error | undefined;

  public withImmediateTransaction<T>(
    operation: (transaction: BookingWriteTransaction) => T,
  ): T {
    this.transactionCount += 1;
    return operation(this);
  }

  public createBookingWithSlots(
    booking: Booking,
    slotStartsAtUtc: readonly number[],
  ): void {
    if (this.createError) {
      throw this.createError;
    }

    this.bookings.push(booking);
    this.slotStartsByBooking.set(booking.id, [...slotStartsAtUtc]);
  }

  public findBookingForCancellation(bookingId: string): Booking | null {
    return this.bookings.find((booking) => booking.id === bookingId) ?? null;
  }

  public cancelBookingAndReleaseSlots(
    bookingId: string,
    cancelledAtUtc: number,
  ): void {
    this.cancelCount += 1;
    this.bookings = this.bookings.map((booking) =>
      booking.id === bookingId ? { ...booking, cancelledAtUtc } : booking,
    );
    this.slotStartsByBooking.delete(bookingId);
  }
}

class TestRoomReader implements RoomReader {
  public readonly existingRoomIds = new Set(['room-aquarium']);

  public exists(roomId: string): boolean {
    return this.existingRoomIds.has(roomId);
  }

  public list(): readonly [] {
    return [];
  }
}

class TestVerificationStatusReader implements EmailVerificationStatusReader {
  public verified = true;

  public isEmailVerified(): boolean {
    return this.verified;
  }
}

class MutableClock implements BookingClock {
  public constructor(public value: number) {}

  public now(): number {
    return this.value;
  }
}

class SequenceIdGenerator implements BookingIdGenerator {
  public generatedCount = 0;

  public generate(): string {
    this.generatedCount += 1;
    return `booking-${this.generatedCount}`;
  }
}
