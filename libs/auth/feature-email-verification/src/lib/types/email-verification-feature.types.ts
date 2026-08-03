import type { SafeUser } from '@mr-booking/auth-domain';
import type { FeatureError } from '@mr-booking/shared-feature-error';
import type { AppDictionary, Locale } from '@mr-booking/shared-i18n';
import type { ReactNode } from 'react';

export type EmailVerificationErrorCode =
  'rateLimited' | 'deliveryFailed' | 'unauthenticated' | 'invalid' | 'service';

export interface EmailVerificationErrorContext {
  readonly status?: number;
  readonly operationAttempt: number;
}

export type EmailVerificationFeatureError = FeatureError<
  EmailVerificationErrorCode,
  EmailVerificationErrorCode,
  'emailVerification',
  'resend' | 'verify',
  EmailVerificationErrorContext
>;

export interface AuthSessionBoundaryProps {
  readonly initialUser: SafeUser;
  readonly children: ReactNode;
}

export interface EmailVerificationBannerProps {
  readonly locale: Locale;
  readonly messages: AppDictionary['emailVerification'];
  readonly scheduleHref: string;
}

export interface EmailVerificationPageProps {
  readonly locale: Locale;
  readonly messages: AppDictionary['emailVerification'];
  readonly initialUser: SafeUser | undefined;
  readonly scheduleHref: string;
  readonly loginHref: string;
}
