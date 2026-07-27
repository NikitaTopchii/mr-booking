import type { Response } from 'express';
import { SessionCookieService } from './session-cookie.service';

describe('SessionCookieService production policy', () => {
  it('sets and clears Secure cookies in production', () => {
    const previousEnvironment = { ...process.env };
    process.env['NODE_ENV'] = 'production';
    process.env['APP_PORT'] = '3000';
    process.env['WEB_INTERNAL_PORT'] = '3001';
    process.env['API_INTERNAL_PORT'] = '3002';
    process.env['DATABASE_PATH'] = '/data/test.sqlite';
    process.env['SEED_ON_START'] = 'false';
    process.env['OFFICE_TIME_ZONE'] = 'Europe/Kyiv';
    process.env['OFFICE_OPEN_TIME'] = '09:00';
    process.env['OFFICE_CLOSE_TIME'] = '19:00';
    process.env['WEB_ORIGIN'] = 'https://example.com';
    process.env['API_INTERNAL_URL'] = 'http://api:3002';
    process.env['SESSION_COOKIE_NAME'] = 'room_booking_session';
    process.env['SESSION_TTL_DAYS'] = '7';
    const response = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    } as unknown as Response;

    try {
      const service = new SessionCookieService();
      service.set(response, 'raw-token', Date.now() + 60_000);
      service.clear(response);

      expect(response.cookie).toHaveBeenCalledWith(
        'room_booking_session',
        'raw-token',
        expect.objectContaining({
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        }),
      );
      expect(response.clearCookie).toHaveBeenCalledWith(
        'room_booking_session',
        expect.objectContaining({
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          path: '/',
        }),
      );
    } finally {
      process.env = previousEnvironment;
    }
  });
});
