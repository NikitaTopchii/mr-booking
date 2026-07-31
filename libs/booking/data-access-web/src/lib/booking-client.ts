import type { z } from 'zod';
import {
  absoluteDateTimeSchema,
  apiErrorSchema,
  bookingResponseSchema,
  bookingsResponseSchema,
  myBookingsResponseSchema,
  myPastBookingsResponseSchema,
  roomsResponseSchema,
} from './booking-client.schemas';
import type {
  BookingClientErrorCode,
  BookingRange,
  CreateBookingInput,
  MyBookingsResponse,
  MyPastBookingsKey,
  MyPastBookingsResponse,
  Room,
  ScheduleBooking,
} from './types/booking-client.types';

export class BookingClientError extends Error {
  public constructor(
    public readonly code: BookingClientErrorCode,
    public readonly status: number | undefined,
  ) {
    super(code);
    this.name = 'BookingClientError';
  }
}

export const bookingKeys = {
  rooms: () => ['booking', 'rooms'] as const,
  schedule: (roomId: string, range: BookingRange) =>
    ['booking', 'schedule', roomId, range.fromUtc, range.toUtc] as const,
  mineUpcoming: () => ['booking', 'mine', 'upcoming'] as const,
  minePast: (cursor: string | null, limit: number) =>
    ['booking', 'mine', 'past', cursor, limit] as MyPastBookingsKey,
};

export function isScheduleKeyForRoom(key: unknown, roomId: string): boolean {
  return (
    Array.isArray(key) &&
    key[0] === 'booking' &&
    key[1] === 'schedule' &&
    key[2] === roomId
  );
}

export async function listRooms(): Promise<readonly Room[]> {
  const response = await request('/api/rooms', { method: 'GET' });
  return parseResponse(response, roomsResponseSchema).then(
    ({ rooms }) => rooms,
  );
}

export async function listRoomBookings(
  roomId: string,
  range: BookingRange,
): Promise<readonly ScheduleBooking[]> {
  assertAbsoluteDateTime(range.fromUtc);
  assertAbsoluteDateTime(range.toUtc);
  const query = new URLSearchParams({
    fromUtc: range.fromUtc,
    toUtc: range.toUtc,
  });
  const response = await request(
    `/api/rooms/${encodeURIComponent(roomId)}/bookings?${query.toString()}`,
    { method: 'GET' },
  );
  return parseResponse(response, bookingsResponseSchema).then(
    ({ bookings }) => bookings,
  );
}

export async function createBooking(
  input: CreateBookingInput,
): Promise<ScheduleBooking> {
  assertAbsoluteDateTime(input.startsAtUtc);
  assertAbsoluteDateTime(input.endsAtUtc);
  const response = await request('/api/bookings', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseResponse(response, bookingResponseSchema).then(
    ({ booking }) => booking,
  );
}

export async function cancelBooking(bookingId: string): Promise<void> {
  await request(`/api/bookings/${encodeURIComponent(bookingId)}`, {
    method: 'DELETE',
  });
}

export async function listMyUpcomingBookings(): Promise<MyBookingsResponse> {
  const response = await request('/api/bookings/mine/upcoming', {
    method: 'GET',
  });
  return parseResponse(response, myBookingsResponseSchema);
}

export async function listMyPastBookings(
  cursor: string | null,
  limit = 20,
): Promise<MyPastBookingsResponse> {
  const query = new URLSearchParams({ limit: String(limit) });
  if (cursor) {
    query.set('cursor', cursor);
  }
  const response = await request(
    `/api/bookings/mine/past?${query.toString()}`,
    { method: 'GET' },
  );
  return parseResponse(response, myPastBookingsResponseSchema);
}

export function fetchMyPastBookingsPage(
  key: MyPastBookingsKey,
): Promise<MyPastBookingsResponse> {
  const [, , , cursor, limit] = key;
  return listMyPastBookings(cursor, limit);
}

async function request(endpoint: string, init: RequestInit): Promise<Response> {
  let response: Response;

  try {
    response = await fetch(endpoint, {
      ...init,
      credentials: 'same-origin',
      cache: 'no-store',
    });
  } catch {
    throw new BookingClientError('NETWORK_ERROR', undefined);
  }

  if (!response.ok) {
    throw await parseError(response);
  }

  return response;
}

async function parseResponse<T>(
  response: Response,
  schema: z.ZodType<T>,
): Promise<T> {
  try {
    const parsed = schema.safeParse(await response.json());

    if (parsed.success) {
      return parsed.data;
    }
  } catch {
    // The normalized error below intentionally hides malformed server output.
  }

  throw new BookingClientError('INVALID_RESPONSE', response.status);
}

async function parseError(response: Response): Promise<BookingClientError> {
  try {
    const parsed = apiErrorSchema.safeParse(await response.json());

    if (parsed.success) {
      return new BookingClientError(parsed.data.code, response.status);
    }
  } catch {
    // The normalized error below intentionally hides malformed server output.
  }

  return new BookingClientError('INVALID_RESPONSE', response.status);
}

function assertAbsoluteDateTime(value: string): void {
  if (!absoluteDateTimeSchema.safeParse(value).success) {
    throw new BookingClientError('INVALID_RESPONSE', undefined);
  }
}
