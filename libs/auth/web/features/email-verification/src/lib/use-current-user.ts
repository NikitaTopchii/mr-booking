'use client';

import {
  authKeys,
  fetchCurrentUser,
} from '@mr-booking/auth-data-access-web/client';
import type { SafeUser } from '@mr-booking/auth-domain';
import { useCallback } from 'react';
import useSWR from 'swr';

export function useCurrentUser(initialUser?: SafeUser) {
  const query = useSWR(
    authKeys.currentUser(),
    fetchCurrentUser,
    initialUser ? { fallbackData: { user: initialUser } } : undefined,
  );

  const refresh = useCallback(() => query.mutate(), [query]);

  return {
    user: query.data?.user ?? initialUser,
    loading: Boolean(initialUser) && !query.data && !query.error,
    error: query.error,
    refresh,
  };
}
