import { z } from 'zod';

const absoluteDateTimeSchema = z.iso.datetime({ offset: true });
const roomSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    floor: z.number().int(),
    capacity: z.number().int().positive(),
  })
  .strict();
const bookingSchema = z
  .object({
    id: z.string().min(1),
    roomId: z.string().min(1),
    title: z.string(),
    startsAtUtc: absoluteDateTimeSchema,
    endsAtUtc: absoluteDateTimeSchema,
    author: z
      .object({
        id: z.string().min(1),
        name: z.string().min(1),
      })
      .strict(),
    isMine: z.boolean(),
  })
  .strict();
const roomsResponseSchema = z.object({ rooms: z.array(roomSchema) }).strict();
const bookingsResponseSchema = z
  .object({ bookings: z.array(bookingSchema) })
  .strict();
const bookingResponseSchema = z.object({ booking: bookingSchema }).strict();
const apiErrorSchema = z
  .object({
    code: z.string().min(1),
  })
  .passthrough();

export type Room = z.infer<typeof roomSchema>;
export type ScheduleBooking = z.infer<typeof bookingSchema>;

export interface BookingRange {
  readonly fromUtc: string;
  readonly toUtc: string;
}

export interface CreateBookingInput {
  readonly roomId: string;
  readonly title: string;
  readonly startsAtUtc: string;
  readonly endsAtUtc: string;
}

export type BookingClientErrorCode =
  'UNAUTHENTICATED' | 'NETWORK_ERROR' | 'INVALID_RESPONSE' | string;

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
};

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
