jest.mock('server-only', () => ({}));
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

import { cookies } from 'next/headers';
import { resolveServerAuth } from './server-auth';

describe('server-side authentication resolution', () => {
  const cookiesMock = jest.mocked(cookies);
  const fetchMock = jest.fn();

  beforeEach(() => {
    cookiesMock.mockReset();
    fetchMock.mockReset();
    process.env['NODE_ENV'] = 'test';
    process.env['API_INTERNAL_URL'] = 'http://api.internal:3002';
    process.env['SESSION_COOKIE_NAME'] = 'room_booking_session';
    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      value: fetchMock,
      writable: true,
    });
  });

  it('returns anonymous without calling the API when the cookie is absent', async () => {
    cookiesMock.mockResolvedValue(cookieStore(undefined));

    await expect(resolveServerAuth()).resolves.toEqual({
      status: 'anonymous',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('forwards only the configured session cookie and validates the safe user', async () => {
    cookiesMock.mockResolvedValue(cookieStore('raw-session-token'));
    fetchMock.mockResolvedValue(
      jsonResponse(200, {
        user: {
          id: 'alice',
          name: 'Alice',
          email: 'alice@example.com',
          emailVerified: true,
        },
      }),
    );

    await expect(resolveServerAuth()).resolves.toEqual({
      status: 'authenticated',
      user: {
        id: 'alice',
        name: 'Alice',
        email: 'alice@example.com',
        emailVerified: true,
      },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.internal:3002/api/auth/me',
      {
        cache: 'no-store',
        headers: {
          cookie: 'room_booking_session=raw-session-token',
        },
      },
    );
  });

  it.each([
    [
      'an unauthorized response',
      jsonResponse(401, { code: 'UNAUTHENTICATED' }),
    ],
    [
      'a malformed success response',
      jsonResponse(200, {
        user: {
          id: 'alice',
          name: 'Alice',
          email: 'alice@example.com',
          tokenHash: 'must-not-cross-the-boundary',
        },
      }),
    ],
  ])('handles %s safely', async (_scenario, response) => {
    cookiesMock.mockResolvedValue(cookieStore('raw-session-token'));
    fetchMock.mockResolvedValue(response);

    await expect(resolveServerAuth()).resolves.toEqual(
      response.status === 401
        ? { status: 'anonymous' }
        : { status: 'unavailable' },
    );
  });
});

function cookieStore(value: string | undefined) {
  return {
    get: jest.fn().mockReturnValue(
      value
        ? {
            name: 'room_booking_session',
            value,
          }
        : undefined,
    ),
  } as never;
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
