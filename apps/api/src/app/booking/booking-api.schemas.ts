import { z } from 'zod';

const identifierSchema = z.string().min(1).max(200);
const absoluteDateTimeSchema = z.iso
  .datetime({ offset: true })
  .transform((value) => Date.parse(value));

export const roomIdParameterSchema = z.strictObject({
  roomId: identifierSchema,
});

export const bookingIdParameterSchema = z.strictObject({
  bookingId: identifierSchema,
});

export const roomScheduleQuerySchema = z
  .strictObject({
    fromUtc: absoluteDateTimeSchema,
    toUtc: absoluteDateTimeSchema,
  })
  .refine(({ fromUtc, toUtc }) => fromUtc < toUtc);

export const createBookingBodySchema = z.strictObject({
  roomId: identifierSchema,
  title: z.string(),
  startsAtUtc: absoluteDateTimeSchema,
  endsAtUtc: absoluteDateTimeSchema,
});

export const myPastBookingsQuerySchema = z
  .strictObject({
    cursor: z.string().min(1).max(1_000).optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .transform(({ cursor, limit }) => ({
    cursor,
    limit,
  }));

export interface RoomDto {
  readonly id: string;
  readonly name: string;
  readonly floor: number;
  readonly capacity: number;
}

export interface ScheduleBookingDto {
  readonly id: string;
  readonly roomId: string;
  readonly title: string;
  readonly startsAtUtc: string;
  readonly endsAtUtc: string;
  readonly author: {
    readonly id: string;
    readonly name: string;
  };
  readonly isMine: boolean;
}

export interface MyBookingDto {
  readonly id: string;
  readonly title: string;
  readonly startsAtUtc: string;
  readonly endsAtUtc: string;
  readonly room: RoomDto;
  readonly status: 'UPCOMING' | 'IN_PROGRESS' | 'PAST';
  readonly canCancel: boolean;
}

export interface MyBookingsDto {
  readonly items: readonly MyBookingDto[];
  readonly serverNowUtc: string;
}

export interface MyPastBookingsDto extends MyBookingsDto {
  readonly nextCursor: string | null;
}

export type CreateBookingBody = z.output<typeof createBookingBodySchema>;
