'use client';

import { requestEmailVerification } from '@mr-booking/auth-data-access-web/client';
import {
  createFeatureErrorFactory,
  defaultFeatureErrorReporter,
  systemFeatureErrorClock,
} from '@mr-booking/shared-error-handling';
import type { Locale } from '@mr-booking/shared-i18n';
import { useMemo, useRef, useState } from 'react';
import useSWRMutation from 'swr/mutation';
import { emailVerificationErrorCatalog } from './email-verification-error.catalog';
import { classifyEmailVerificationError } from './email-verification-errors';
import type { EmailVerificationFeatureError } from './types/email-verification-feature.types';

export function useEmailVerificationResend(locale: Locale) {
  const operationAttempt = useRef(0);
  const [error, setError] = useState<EmailVerificationFeatureError>();
  const [developmentVerificationUrl, setDevelopmentVerificationUrl] =
    useState<string>();
  const [retryAfterSeconds, setRetryAfterSeconds] = useState<number>();
  const mutation = useSWRMutation(
    ['auth', 'email-verification', 'resend'],
    () => requestEmailVerification(locale),
  );
  const errorFactory = useMemo(
    () =>
      createFeatureErrorFactory<
        'emailVerification',
        'resend',
        typeof emailVerificationErrorCatalog,
        { readonly operationAttempt: number; readonly status?: number }
      >({
        feature: 'emailVerification',
        operation: 'resend',
        catalog: emailVerificationErrorCatalog,
        clock: systemFeatureErrorClock,
        reporter: defaultFeatureErrorReporter,
      }),
    [],
  );

  async function resend(): Promise<void> {
    if (mutation.isMutating) return;
    const attempt = ++operationAttempt.current;
    setError(undefined);
    setRetryAfterSeconds(undefined);

    try {
      const result = await mutation.trigger();
      setDevelopmentVerificationUrl(result.developmentVerificationUrl);
    } catch (cause) {
      const code = classifyEmailVerificationError(cause);
      const status =
        typeof cause === 'object' && cause !== null && 'status' in cause
          ? typeof cause.status === 'number'
            ? cause.status
            : undefined
          : undefined;
      const retryAfter =
        typeof cause === 'object' &&
        cause !== null &&
        'retryAfterSeconds' in cause &&
        typeof cause.retryAfterSeconds === 'number'
          ? cause.retryAfterSeconds
          : undefined;
      setRetryAfterSeconds(retryAfter);
      setError(
        errorFactory.create({
          code,
          context: {
            operationAttempt: attempt,
            ...(status === undefined ? {} : { status }),
          },
          cause,
        }),
      );
    }
  }

  return {
    pending: mutation.isMutating,
    sent: Boolean(developmentVerificationUrl) || Boolean(mutation.data),
    developmentVerificationUrl,
    retryAfterSeconds,
    error,
    resend,
  };
}
