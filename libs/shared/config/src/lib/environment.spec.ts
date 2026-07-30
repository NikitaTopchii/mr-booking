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
      API_INTERNAL_URL: 'http://localhost:3002',
      SESSION_COOKIE_NAME: 'room_booking_session',
      SESSION_TTL_DAYS: 7,
      DEMO_SEED_WEEK_START: undefined,
    });
  });

  it('requires complete production configuration', () => {
    expect(() => parseRuntimeEnvironment({ NODE_ENV: 'production' })).toThrow(
      EnvironmentValidationError,
    );
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
