import 'server-only';

import type { SafeUser } from '@mr-booking/auth-domain';
import { cookies } from 'next/headers';
import { z } from 'zod';

const currentUserResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
  }),
});

export type ServerAuthState =
  | { readonly status: 'authenticated'; readonly user: SafeUser }
  | { readonly status: 'anonymous' }
  | { readonly status: 'unavailable' };

export async function resolveServerAuth(): Promise<ServerAuthState> {
  const apiInternalUrl =
    process.env['API_INTERNAL_URL'] ?? 'http://localhost:3002';
  const sessionCookieName =
    process.env['SESSION_COOKIE_NAME'] ?? 'room_booking_session';
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(sessionCookieName);

  if (!sessionCookie) {
    return { status: 'anonymous' };
  }

  try {
    const response = await fetch(`${apiInternalUrl}/api/auth/me`, {
      cache: 'no-store',
      headers: {
        cookie: `${sessionCookieName}=${sessionCookie.value}`,
      },
    });

    if (response.status === 401) {
      return { status: 'anonymous' };
    }

    if (!response.ok) {
      return { status: 'unavailable' };
    }

    const result = currentUserResponseSchema.safeParse(await response.json());
    return result.success
      ? { status: 'authenticated', user: result.data.user }
      : { status: 'unavailable' };
  } catch {
    return { status: 'unavailable' };
  }
}
