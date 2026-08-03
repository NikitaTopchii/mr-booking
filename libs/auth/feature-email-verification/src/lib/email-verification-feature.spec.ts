import {
  emailVerificationRequestResponseSchema,
  emailVerificationVerifyResponseSchema,
} from '@mr-booking/auth-data-access-web/client';

describe('email verification web boundary', () => {
  it('accepts a development link only as an optional safe response field', () => {
    expect(
      emailVerificationRequestResponseSchema.parse({
        status: 'sent',
        code: 'EMAIL_VERIFICATION_SENT',
        expiresAtUtc: '2026-08-03T12:00:00.000Z',
        retryAfterSeconds: 60,
        developmentVerificationUrl:
          'http://localhost:3000/uk/verify-email?token=abc',
      }),
    ).toMatchObject({ status: 'sent', retryAfterSeconds: 60 });
  });

  it('rejects token records and accepts only the public verification result', () => {
    expect(
      emailVerificationVerifyResponseSchema.parse({ code: 'EMAIL_VERIFIED' }),
    ).toEqual({ code: 'EMAIL_VERIFIED' });
    expect(() =>
      emailVerificationVerifyResponseSchema.parse({
        code: 'EMAIL_VERIFIED',
        tokenHash: 'sensitive',
      }),
    ).toThrow();
  });
});
