import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import {
  BOOKING_CLOCK,
  BOOKING_ID_GENERATOR,
  BOOKING_REPOSITORY,
  BookingCancellationForbiddenError,
  BookingNotCancellableError,
  BookingNotFoundError,
  RoomNotFoundError,
  generateBookingSlotStarts,
  normalizeBookingTitle,
  validateBookingInterval,
  type Booking,
  type BookingClock,
  type BookingIdGenerator,
  type BookingRepository,
} from '@mr-booking/booking-domain';
import { ROOM_READER, type RoomReader } from '@mr-booking/rooms-domain';
import { CancelBookingCommand, CreateBookingCommand } from './booking-commands';

@CommandHandler(CreateBookingCommand)
export class CreateBookingHandler implements ICommandHandler<
  CreateBookingCommand,
  Booking
> {
  public constructor(
    @Inject(BOOKING_REPOSITORY)
    private readonly repository: BookingRepository,
    @Inject(ROOM_READER)
    private readonly roomReader: RoomReader,
    @Inject(BOOKING_CLOCK)
    private readonly clock: BookingClock,
    @Inject(BOOKING_ID_GENERATOR)
    private readonly idGenerator: BookingIdGenerator,
  ) {}

  public async execute(command: CreateBookingCommand): Promise<Booking> {
    const title = normalizeBookingTitle(command.title);
    const createdAtUtc = this.clock.now();
    const interval = validateBookingInterval(
      command.startsAtUtc,
      command.endsAtUtc,
      createdAtUtc,
    );

    if (!this.roomReader.exists(command.roomId)) {
      throw new RoomNotFoundError();
    }

    const booking: Booking = {
      id: this.idGenerator.generate(),
      roomId: command.roomId,
      authorUserId: command.authorUserId,
      title,
      startsAtUtc: interval.startsAtUtc,
      endsAtUtc: interval.endsAtUtc,
      createdAtUtc,
      cancelledAtUtc: null,
    };
    const slotStartsAtUtc = generateBookingSlotStarts(interval);

    return this.repository.withImmediateTransaction((transaction) => {
      transaction.createBookingWithSlots(booking, slotStartsAtUtc);
      return booking;
    });
  }
}

@CommandHandler(CancelBookingCommand)
export class CancelBookingHandler implements ICommandHandler<
  CancelBookingCommand,
  Booking
> {
  public constructor(
    @Inject(BOOKING_REPOSITORY)
    private readonly repository: BookingRepository,
    @Inject(BOOKING_CLOCK)
    private readonly clock: BookingClock,
  ) {}

  public async execute(command: CancelBookingCommand): Promise<Booking> {
    const cancelledAtUtc = this.clock.now();

    return this.repository.withImmediateTransaction((transaction) => {
      const booking = transaction.findBookingForCancellation(command.bookingId);

      if (!booking) {
        throw new BookingNotFoundError();
      }

      if (booking.authorUserId !== command.authenticatedUserId) {
        throw new BookingCancellationForbiddenError();
      }

      if (booking.cancelledAtUtc !== null) {
        return booking;
      }

      if (booking.startsAtUtc <= cancelledAtUtc) {
        throw new BookingNotCancellableError();
      }

      transaction.cancelBookingAndReleaseSlots(booking.id, cancelledAtUtc);

      return {
        ...booking,
        cancelledAtUtc,
      };
    });
  }
}
