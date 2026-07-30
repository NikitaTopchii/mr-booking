import { z } from 'zod';

export const absoluteDateTimeSchema = z.iso.datetime({ offset: true });
const canonicalUtcDateTimeSchema = z.iso
  .datetime()
  .refine((value) => new Date(value).toISOString() === value);

export const roomSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    floor: z.number().int(),
    capacity: z.number().int().positive(),
  })
  .strict();

export const bookingSchema = z
  .object({
    id: z.string().min(1),
    roomId: z.string().min(1),
    title: z.string(),
    startsAtUtc: canonicalUtcDateTimeSchema,
    endsAtUtc: canonicalUtcDateTimeSchema,
    author: z
      .object({
        id: z.string().min(1),
        name: z.string().min(1),
      })
      .strict(),
    isMine: z.boolean(),
  })
  .strict();

export const roomsResponseSchema = z
  .object({ rooms: z.array(roomSchema) })
  .strict();
export const bookingsResponseSchema = z
  .object({ bookings: z.array(bookingSchema) })
  .strict();
export const bookingResponseSchema = z
  .object({ booking: bookingSchema })
  .strict();

export const myBookingSchema = z
  .object({
    id: z.string().min(1),
    title: z.string(),
    startsAtUtc: canonicalUtcDateTimeSchema,
    endsAtUtc: canonicalUtcDateTimeSchema,
    room: roomSchema,
    status: z.enum(['UPCOMING', 'IN_PROGRESS', 'PAST']),
    canCancel: z.boolean(),
  })
  .strict();

export const myBookingsResponseSchema = z
  .object({
    items: z.array(myBookingSchema),
    serverNowUtc: canonicalUtcDateTimeSchema,
  })
  .strict();

export const myPastBookingsResponseSchema = myBookingsResponseSchema
  .extend({
    nextCursor: z.string().min(1).nullable(),
  })
  .strict();

export const apiErrorSchema = z
  .object({
    code: z.string().min(1),
  })
  .passthrough();
