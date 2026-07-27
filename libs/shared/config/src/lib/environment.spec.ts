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
});
