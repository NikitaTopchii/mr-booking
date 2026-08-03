'use client';

import { verifyEmail } from '@mr-booking/auth-data-access-web/client';
import {
  createFeatureErrorFactory,
  defaultFeatureErrorReporter,
  systemFeatureErrorClock,
} from '@mr-booking/shared-feature-error';
import { useMemo, useRef, useState } from 'react';
import useSWRMutation from 'swr/mutation';
import { emailVerificationErrorCatalog } from './email-verification-error.catalog';
import { classifyEmailVerificationError } from './email-verification-errors';
import type { EmailVerificationFeatureError } from './types/email-verification-feature.types';

export function useEmailVerificationVerify() {
  const operationAttempt = useRef(0);
  const [error, setError] = useState<EmailVerificationFeatureError>();
  const mutation = useSWRMutation(
    ['auth', 'email-verification', 'verify'],
    (_key, { arg }: { readonly arg: string }) => verifyEmail(arg),
  );
  const errorFactory = useMemo(
    () =>
      createFeatureErrorFactory<
        'emailVerification',
        'verify',
        typeof emailVerificationErrorCatalog,
        { readonly operationAttempt: number; readonly status?: number }
      >({
        feature: 'emailVerification',
        operation: 'verify',
        catalog: emailVerificationErrorCatalog,
        clock: systemFeatureErrorClock,
        reporter: defaultFeatureErrorReporter,
      }),
    [],
  );

  async function verify(token: string) {
    const attempt = ++operationAttempt.current;
    setError(undefined);

    try {
      return await mutation.trigger(token);
    } catch (cause) {
      const status =
        typeof cause === 'object' && cause !== null && 'status' in cause
          ? typeof cause.status === 'number'
            ? cause.status
            : undefined
          : undefined;
      const featureError = errorFactory.create({
        code: classifyEmailVerificationError(cause),
        context: {
          operationAttempt: attempt,
          ...(status === undefined ? {} : { status }),
        },
        cause,
      });
      setError(featureError);
      return undefined;
    }
  }

  return {
    pending: mutation.isMutating,
    error,
    verify,
  };
}
