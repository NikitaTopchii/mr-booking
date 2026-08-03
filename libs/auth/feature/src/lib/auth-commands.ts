export class RegisterUserCommand {
  public constructor(
    public readonly input: unknown,
    public readonly locale: 'uk' | 'en' = 'uk',
  ) {}
}

export class LoginUserCommand {
  public constructor(public readonly input: unknown) {}
}

export class LogoutSessionCommand {
  public constructor(public readonly rawSessionToken: string) {}
}

export class RequestEmailVerificationCommand {
  public constructor(
    public readonly authenticatedUserId: string,
    public readonly locale: 'uk' | 'en',
    public readonly kind: EmailVerificationRequestKind,
  ) {}
}

export class VerifyEmailCommand {
  public constructor(public readonly rawToken: string) {}
}
import type { EmailVerificationRequestKind } from './types/email-verification.types';
