import type { AuthClientError } from './auth-client';
import {
  getCurrentUser,
  loginUser,
  logoutSession,
  registerUser,
} from './auth-client';

describe('browser auth client', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      value: fetchMock,
      writable: true,
    });
  });

  it('runtime-validates successful authentication responses', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, {
        user: {
          id: 'alice',
          name: 'Alice',
          email: 'alice@example.com',
        },
      }),
    );

    await expect(
      loginUser({
        email: 'alice@example.com',
        password: 'password123',
      }),
    ).resolves.toEqual({
      user: {
        id: 'alice',
        name: 'Alice',
        email: 'alice@example.com',
      },
    });
  });

  it('throws typed expected API errors with stable field codes', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(409, {
        code: 'EMAIL_ALREADY_EXISTS',
        details: { fields: { email: 'EMAIL_ALREADY_EXISTS' } },
      }),
    );

    await expect(
      registerUser({
        name: 'Alice',
        email: 'alice@example.com',
        password: 'password123',
      }),
    ).rejects.toMatchObject({
      code: 'EMAIL_ALREADY_EXISTS',
      status: 409,
      fields: { email: 'EMAIL_ALREADY_EXISTS' },
    });
  });

  it.each([
    ['malformed JSON', new Response('{', { status: 500 })],
    [
      'an unexpected field code',
      jsonResponse(400, {
        code: 'VALIDATION_ERROR',
        details: { fields: { email: 'INTERNAL_PROSE' } },
      }),
    ],
    [
      'an incomplete duplicate-email contract',
      jsonResponse(409, {
        code: 'EMAIL_ALREADY_EXISTS',
      }),
    ],
  ])('maps %s to a generic service failure', async (_scenario, response) => {
    fetchMock.mockResolvedValue(response);

    await expect(
      loginUser({
        email: 'alice@example.com',
        password: 'password123',
      }),
    ).rejects.toMatchObject({ code: 'SERVICE_UNAVAILABLE' });
  });

  it('rejects success payloads containing unvalidated sensitive fields', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, {
        user: {
          id: 'alice',
          name: 'Alice',
          email: 'alice@example.com',
          passwordHash: 'must-not-cross-the-boundary',
        },
      }),
    );

    await expect(getCurrentUser()).rejects.toMatchObject({
      code: 'SERVICE_UNAVAILABLE',
    });
  });

  it('maps network failures without exposing the underlying error', async () => {
    fetchMock.mockRejectedValue(new Error('sensitive network detail'));

    await expect(logoutSession()).rejects.toEqual(
      expect.objectContaining<AuthClientError>({
        code: 'NETWORK_ERROR',
        name: 'AuthClientError',
      }),
    );
  });
});

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
