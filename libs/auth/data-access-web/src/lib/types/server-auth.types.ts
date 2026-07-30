import type { SafeUser } from '@mr-booking/auth-domain';

export type ServerAuthState =
  | { readonly status: 'authenticated'; readonly user: SafeUser }
  | { readonly status: 'anonymous' }
  | { readonly status: 'unavailable' };
