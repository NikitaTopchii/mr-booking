export interface SafeUser {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly emailVerified: boolean;
}

export interface UserCredentials {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly emailVerifiedAtUtc: number | null;
}

export interface NewUserRecord extends UserCredentials {
  readonly normalizedEmail: string;
  readonly createdAtUtc: number;
}

export interface NewSessionRecord {
  readonly id: string;
  readonly userId: string;
  readonly tokenHash: string;
  readonly createdAtUtc: number;
  readonly expiresAtUtc: number;
}

export interface AuthenticationResult {
  readonly user: SafeUser;
  readonly rawSessionToken: string;
  readonly expiresAtUtc: number;
  readonly emailVerification?: EmailVerificationDeliveryResult;
}

export type EmailVerificationLocale = 'uk' | 'en';

export type EmailVerificationDeliveryStatus =
  'sent' | 'delivery-failed' | 'already-verified';

export interface EmailVerificationDeliveryResult {
  readonly status: EmailVerificationDeliveryStatus;
  readonly code:
    | 'EMAIL_VERIFICATION_SENT'
    | 'EMAIL_VERIFICATION_DELIVERY_FAILED'
    | 'EMAIL_ALREADY_VERIFIED';
  readonly expiresAtUtc?: string;
  readonly retryAfterSeconds?: number;
  readonly developmentVerificationUrl?: string;
}

export interface EmailVerificationResult {
  readonly code: 'EMAIL_VERIFIED' | 'EMAIL_ALREADY_VERIFIED';
}

export interface EmailVerificationTokenRecord {
  readonly id: string;
  readonly userId: string;
  readonly tokenHash: string;
  readonly createdAtUtc: number;
  readonly expiresAtUtc: number;
  readonly consumedAtUtc: number | null;
  readonly invalidatedAtUtc: number | null;
}

export interface NewEmailVerificationTokenRecord {
  readonly id: string;
  readonly userId: string;
  readonly tokenHash: string;
  readonly createdAtUtc: number;
  readonly expiresAtUtc: number;
}

export interface EmailVerificationEmail {
  readonly email: string;
  readonly name: string;
  readonly locale: EmailVerificationLocale;
  readonly verificationUrl: string;
  readonly expiresAtUtc: number;
}

export function toSafeUser(user: UserCredentials): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerifiedAtUtc !== null,
  };
}
