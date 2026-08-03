import {
  EnvironmentValidationError,
  parseRuntimeEnvironment,
} from './environment';

describe('parseRuntimeEnvironment', () => {
  it('provides safe local development defaults', () => {
    expect(parseRuntimeEnvironment({})).toEqual({
      NODE_ENV: 'development',
      APP_PORT: 3000,
      WEB_INTERNAL_PORT: 3001,
      API_INTERNAL_PORT: 3002,
      DATABASE_PATH: '.data/mr-booking.sqlite',
      SEED_ON_START: true,
      OFFICE_TIME_ZONE: 'Europe/Kyiv',
      OFFICE_OPEN_TIME: '09:00',
      OFFICE_CLOSE_TIME: '19:00',
      WEB_ORIGIN: 'http://localhost:3000',
      APP_PUBLIC_URL: 'http://localhost:3001',
      API_INTERNAL_URL: 'http://localhost:3002',
      SESSION_COOKIE_NAME: 'room_booking_session',
      SESSION_TTL_DAYS: 7,
      EMAIL_VERIFICATION_TOKEN_TTL_MINUTES: 1440,
      EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS: 60,
      EMAIL_DELIVERY_MODE: 'development',
      EXPOSE_DEVELOPMENT_VERIFICATION_LINK: true,
      LOG_DEVELOPMENT_VERIFICATION_LINK: false,
      DEMO_SEED_WEEK_START: undefined,
    });
  });

  it('requires complete production configuration', () => {
    expect(() => parseRuntimeEnvironment({ NODE_ENV: 'production' })).toThrow(
      EnvironmentValidationError,
    );
  });

  it('rejects development email delivery and exposed links in production', () => {
    const production = {
      NODE_ENV: 'production',
      APP_PORT: '3000',
      WEB_INTERNAL_PORT: '3001',
      API_INTERNAL_PORT: '3002',
      DATABASE_PATH: '/data/mr-booking.sqlite',
      SEED_ON_START: 'false',
      OFFICE_TIME_ZONE: 'Europe/Kyiv',
      OFFICE_OPEN_TIME: '09:00',
      OFFICE_CLOSE_TIME: '19:00',
      WEB_ORIGIN: 'https://booking.example.com',
      APP_PUBLIC_URL: 'https://booking.example.com',
      API_INTERNAL_URL: 'http://api:3002',
      SESSION_COOKIE_NAME: 'room_booking_session',
      SESSION_TTL_DAYS: '7',
      EMAIL_VERIFICATION_TOKEN_TTL_MINUTES: '1440',
      EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS: '60',
      EMAIL_DELIVERY_MODE: 'development',
      EXPOSE_DEVELOPMENT_VERIFICATION_LINK: 'true',
      LOG_DEVELOPMENT_VERIFICATION_LINK: 'false',
    };

    expect(() => parseRuntimeEnvironment(production)).toThrow(
      'development delivery is not allowed in production',
    );
  });

  it('rejects the test-only verification TTL outside test environments', () => {
    expect(() =>
      parseRuntimeEnvironment({
        NODE_ENV: 'development',
        E2E_EMAIL_VERIFICATION_TOKEN_TTL_SECONDS: '2',
      }),
    ).toThrow('test-only verification TTL is only allowed in test');
  });

  it('rejects an invalid verification TTL or cooldown', () => {
    expect(() =>
      parseRuntimeEnvironment({
        EMAIL_VERIFICATION_TOKEN_TTL_MINUTES: '0',
      }),
    ).toThrow(EnvironmentValidationError);
    expect(() =>
      parseRuntimeEnvironment({
        EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS: '0',
      }),
    ).toThrow(EnvironmentValidationError);
  });

  it('rejects invalid ports and office policy overrides', () => {
    expect(() =>
      parseRuntimeEnvironment({
        API_INTERNAL_PORT: '70000',
        OFFICE_TIME_ZONE: 'UTC',
      }),
    ).toThrow('Invalid runtime environment');
  });

  it('parses the seed switch explicitly', () => {
    expect(
      parseRuntimeEnvironment({ SEED_ON_START: 'false' }).SEED_ON_START,
    ).toBe(false);
  });

  it('validates session configuration', () => {
    expect(
      parseRuntimeEnvironment({
        SESSION_COOKIE_NAME: 'custom_session',
        SESSION_TTL_DAYS: '30',
      }),
    ).toMatchObject({
      SESSION_COOKIE_NAME: 'custom_session',
      SESSION_TTL_DAYS: 30,
    });

    expect(() => parseRuntimeEnvironment({ SESSION_TTL_DAYS: '0' })).toThrow(
      EnvironmentValidationError,
    );
  });

  it('accepts only a valid Monday for the optional demo reference week', () => {
    expect(
      parseRuntimeEnvironment({
        DEMO_SEED_WEEK_START: '2030-06-03',
      }).DEMO_SEED_WEEK_START,
    ).toBe('2030-06-03');

    expect(() =>
      parseRuntimeEnvironment({ DEMO_SEED_WEEK_START: '2030-06-04' }),
    ).toThrow('DEMO_SEED_WEEK_START');
    expect(() =>
      parseRuntimeEnvironment({ DEMO_SEED_WEEK_START: '2030-02-30' }),
    ).toThrow('DEMO_SEED_WEEK_START');
    expect(
      parseRuntimeEnvironment({ DEMO_SEED_WEEK_START: '' })
        .DEMO_SEED_WEEK_START,
    ).toBeUndefined();
  });
});
