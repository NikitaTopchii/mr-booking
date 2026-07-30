import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { MyPastBookingsCursor } from '@mr-booking/booking-domain';
import { z } from 'zod';

const cursorPayloadSchema = z.strictObject({
  version: z.literal(1),
  startsAtUtc: z.number().int().safe(),
  bookingId: z.string().min(1).max(200),
});
const cursorSigningKey = randomBytes(32);

export function encodeMyBookingsCursor(cursor: MyPastBookingsCursor): string {
  const payload = Buffer.from(
    JSON.stringify({
      version: 1,
      startsAtUtc: cursor.startsAtUtc,
      bookingId: cursor.bookingId,
    }),
    'utf8',
  ).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function decodeMyBookingsCursor(value: string): MyPastBookingsCursor {
  try {
    const parts = value.split('.');
    const payload = parts[0];
    const signature = parts[1];
    if (!payload || !signature || parts.length !== 2) {
      throw new Error('INVALID_CURSOR');
    }
    const expectedSignature = sign(payload);
    const receivedBytes = Buffer.from(signature, 'base64url');
    const expectedBytes = Buffer.from(expectedSignature, 'base64url');
    if (
      receivedBytes.length !== expectedBytes.length ||
      !timingSafeEqual(receivedBytes, expectedBytes)
    ) {
      throw new Error('INVALID_CURSOR');
    }

    const decoded = Buffer.from(payload, 'base64url').toString('utf8');
    const parsed = cursorPayloadSchema.parse(JSON.parse(decoded));

    if (
      Buffer.from(JSON.stringify(parsed), 'utf8').toString('base64url') !==
      payload
    ) {
      throw new Error('INVALID_CURSOR');
    }

    return {
      startsAtUtc: parsed.startsAtUtc,
      bookingId: parsed.bookingId,
    };
  } catch {
    throw new Error('INVALID_CURSOR');
  }
}

function sign(payload: string): string {
  return createHmac('sha256', cursorSigningKey)
    .update(payload, 'utf8')
    .digest('base64url');
}
