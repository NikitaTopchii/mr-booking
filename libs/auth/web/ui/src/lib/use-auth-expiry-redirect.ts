'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export function useAuthExpiryRedirect(
  locale: string,
): (error: unknown) => boolean {
  const router = useRouter();

  return useCallback(
    (error: unknown): boolean => {
      if (!isAuthExpiredError(error)) return false;

      router.replace(`/${locale}/login`);
      return true;
    },
    [locale, router],
  );
}

function isAuthExpiredError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;

  const candidate = error as {
    readonly code?: unknown;
    readonly status?: unknown;
  };
  return candidate.code === 'UNAUTHENTICATED' || candidate.status === 401;
}
