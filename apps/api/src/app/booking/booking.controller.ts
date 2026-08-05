import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import type { SafeUser } from '@mr-booking/auth-domain';
import type {
  Booking,
  MyBookingsResult,
  MyPastBookingsResult,
  ScheduleBooking,
} from '@mr-booking/booking-domain';
import {
  CancelBookingCommand,
  CreateBookingCommand,
  GetMyPastBookingsQuery,
  GetMyUpcomingBookingsQuery,
  GetRoomsQuery,
  GetRoomScheduleQuery,
} from '@mr-booking/booking-application';
import type { Room } from '@mr-booking/rooms-domain';
import { CurrentUser } from '../auth/auth-request';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import {
  toCreatedBookingDto,
  toMyBookingsDto,
  toMyPastBookingsDto,
  toScheduleBookingDto,
} from './booking-api.mapper';
import {
  bookingIdParameterSchema,
  createBookingBodySchema,
  myPastBookingsQuerySchema,
  roomIdParameterSchema,
  roomScheduleQuerySchema,
  type RoomDto,
  type MyBookingsDto,
  type MyPastBookingsDto,
  type ScheduleBookingDto,
} from './booking-api.schemas';
import { BookingExceptionFilter } from './booking-exception.filter';
import { decodeMyBookingsCursor } from './booking-cursor';

@Controller('rooms')
@UseGuards(SessionAuthGuard)
@UseFilters(BookingExceptionFilter)
export class RoomsController {
  public constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @Header('Cache-Control', 'private, no-store')
  public async list(): Promise<{ readonly rooms: readonly RoomDto[] }> {
    const rooms = await this.queryBus.execute<GetRoomsQuery, readonly Room[]>(
      new GetRoomsQuery(),
    );
    return { rooms };
  }

  @Get(':roomId/bookings')
  @Header('Cache-Control', 'private, no-store')
  public async schedule(
    @CurrentUser() user: SafeUser,
    @Param() rawParameters: unknown,
    @Query() rawQuery: unknown,
  ): Promise<{ readonly bookings: readonly ScheduleBookingDto[] }> {
    const { roomId } = roomIdParameterSchema.parse(rawParameters);
    const { fromUtc, toUtc } = roomScheduleQuerySchema.parse(rawQuery);
    const bookings = await this.queryBus.execute<
      GetRoomScheduleQuery,
      readonly ScheduleBooking[]
    >(new GetRoomScheduleQuery(user.id, roomId, fromUtc, toUtc));

    return { bookings: bookings.map(toScheduleBookingDto) };
  }
}

@Controller('bookings')
@UseGuards(SessionAuthGuard)
@UseFilters(BookingExceptionFilter)
export class BookingsController {
  public constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('mine/upcoming')
  @Header('Cache-Control', 'private, no-store')
  public async mineUpcoming(
    @CurrentUser() user: SafeUser,
  ): Promise<MyBookingsDto> {
    const result = await this.queryBus.execute<
      GetMyUpcomingBookingsQuery,
      MyBookingsResult
    >(new GetMyUpcomingBookingsQuery(user.id));
    return toMyBookingsDto(result);
  }

  @Get('mine/past')
  @Header('Cache-Control', 'private, no-store')
  public async minePast(
    @CurrentUser() user: SafeUser,
    @Query() rawQuery: unknown,
  ): Promise<MyPastBookingsDto> {
    const query = myPastBookingsQuerySchema.parse(rawQuery);
    const cursor = query.cursor ? decodeMyBookingsCursor(query.cursor) : null;
    const result = await this.queryBus.execute<
      GetMyPastBookingsQuery,
      MyPastBookingsResult
    >(new GetMyPastBookingsQuery(user.id, cursor, query.limit));
    return toMyPastBookingsDto(result);
  }

  @Post()
  @Header('Cache-Control', 'private, no-store')
  public async create(
    @CurrentUser() user: SafeUser,
    @Body() rawBody: unknown,
  ): Promise<{ readonly booking: ScheduleBookingDto }> {
    const body = createBookingBodySchema.parse(rawBody);
    const booking = await this.commandBus.execute<
      CreateBookingCommand,
      Booking
    >(
      new CreateBookingCommand(
        user.id,
        body.roomId,
        body.title,
        body.startsAtUtc,
        body.endsAtUtc,
      ),
    );

    return { booking: toCreatedBookingDto(booking, user) };
  }

  @Delete(':bookingId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Header('Cache-Control', 'private, no-store')
  public async cancel(
    @CurrentUser() user: SafeUser,
    @Param() rawParameters: unknown,
  ): Promise<void> {
    const { bookingId } = bookingIdParameterSchema.parse(rawParameters);
    await this.commandBus.execute(new CancelBookingCommand(user.id, bookingId));
  }
}
