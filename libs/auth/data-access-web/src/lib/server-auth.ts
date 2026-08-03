import 'server-only';

import { parseRuntimeEnvironment } from '@mr-booking/shared-config';
import { cookies } from 'next/headers';
import { z } from 'zod';
import type { ServerAuthState } from './types/server-auth.types';

const currentUserResponseSchema = z
  .object({
    user: z
      .object({
        id: z.string(),
        name: z.string(),
        email: z.string(),
        emailVerified: z.boolean(),
      })
      .strict(),
  })
  .strict();

export async function resolveServerAuth(): Promise<ServerAuthState> {
  const environment = parseRuntimeEnvironment(process.env);
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(environment.SESSION_COOKIE_NAME);

  if (!sessionCookie) {
    return { status: 'anonymous' };
  }

  try {
    const response = await fetch(
      `${environment.API_INTERNAL_URL}/api/auth/me`,
      {
        cache: 'no-store',
        headers: {
          cookie: `${environment.SESSION_COOKIE_NAME}=${sessionCookie.value}`,
        },
      },
    );

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
