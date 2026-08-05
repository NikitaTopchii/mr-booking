export type EmailVerificationRequestKind = 'initial' | 'resend';

export interface EmailVerificationConfiguration {
  readonly tokenTtlMilliseconds: number;
  readonly resendCooldownSeconds: number;
  readonly appPublicUrl: string;
  readonly exposeDevelopmentVerificationLink: boolean;
}

export interface EmailVerificationIssueResult {
  readonly userId: string;
  readonly rawToken: string;
  readonly expiresAtUtc: number;
  readonly retryAfterSeconds: number;
}
