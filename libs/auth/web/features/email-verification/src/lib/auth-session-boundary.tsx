'use client';

import { authKeys } from '@mr-booking/auth-data-access-web/client';
import type { AuthSessionBoundaryProps } from './types/email-verification-feature.types';
import { unstable_serialize, SWRConfig } from 'swr';

export function AuthSessionBoundary({
  initialUser,
  children,
}: AuthSessionBoundaryProps) {
  return (
    <SWRConfig
      value={{
        fallback: {
          [unstable_serialize(authKeys.currentUser())]: {
            user: initialUser,
          },
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}
