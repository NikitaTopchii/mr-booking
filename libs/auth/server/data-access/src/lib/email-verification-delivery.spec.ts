import type { LoggerService } from '@nestjs/common';
import {
  DevelopmentEmailVerificationDelivery,
  DisabledEmailVerificationDelivery,
} from '@mr-booking/auth-infrastructure';

describe('email verification delivery', () => {
  it('logs the development link exactly once when explicitly enabled', async () => {
    const logger = createLogger();
    const delivery = new DevelopmentEmailVerificationDelivery(logger, true);
    const input = emailInput('token-a');

    await delivery.sendVerificationEmail(input);

    expect(logger.log).toHaveBeenCalledTimes(1);
    expect(logger.log).toHaveBeenCalledWith(
      '[email-verification:development] Verification link for user user-1: http://localhost:3001/uk/verify-email?token=token-a',
    );
    expect(logger.log.mock.calls[0]?.[0]).not.toContain(input.email);
    expect(logger.log.mock.calls[0]?.[0]).not.toContain(input.name);
  });

  it('does not log when development logging is disabled', async () => {
    const logger = createLogger();
    const delivery = new DevelopmentEmailVerificationDelivery(logger, false);

    await delivery.sendVerificationEmail(emailInput('token-a'));

    expect(logger.log).not.toHaveBeenCalled();
  });

  it('logs each issued URL once and does not repeat a superseded URL', async () => {
    const logger = createLogger();
    const delivery = new DevelopmentEmailVerificationDelivery(logger, true);

    await delivery.sendVerificationEmail(emailInput('token-a'));
    await delivery.sendVerificationEmail(emailInput('token-b'));

    expect(logger.log).toHaveBeenCalledTimes(2);
    expect(logger.log.mock.calls.map(([message]) => message)).toEqual([
      expect.stringContaining('token-a'),
      expect.stringContaining('token-b'),
    ]);
  });

  it('does not log a failed delivery as successful', async () => {
    const logger = createLogger();
    const delivery = new DevelopmentEmailVerificationDelivery(logger, true);
    const invalidInput = {
      ...emailInput('token-a'),
      name: undefined as unknown as string,
    };

    await expect(
      delivery.sendVerificationEmail(invalidInput),
    ).rejects.toThrow();
    expect(logger.log).not.toHaveBeenCalled();
  });

  it('uses the disabled adapter without logging in production delivery mode', async () => {
    const delivery = new DisabledEmailVerificationDelivery();

    await expect(
      delivery.sendVerificationEmail(emailInput('token-a')),
    ).rejects.toThrow('EMAIL_DELIVERY_DISABLED');
  });
});

function createLogger(): LoggerService & { log: jest.Mock } {
  return { log: jest.fn() } as unknown as LoggerService & { log: jest.Mock };
}

function emailInput(token: string) {
  return {
    userId: 'user-1',
    email: 'person@example.com',
    name: 'Person Name',
    locale: 'uk' as const,
    verificationUrl: `http://localhost:3001/uk/verify-email?token=${token}`,
    expiresAtUtc: Date.UTC(2026, 7, 3, 12),
  };
}
