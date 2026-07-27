import {
  AuthClientError,
  logoutSession,
} from '@mr-booking/auth-data-access-web/client';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

export interface LogoutState {
  readonly submitting: boolean;
  readonly failed: boolean;
  readonly logout: () => Promise<void>;
}

export function useLogout(successHref: string): LogoutState {
  const router = useRouter();
  const active = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [failed, setFailed] = useState(false);

  async function logout(): Promise<void> {
    if (active.current) {
      return;
    }

    active.current = true;
    setSubmitting(true);
    setFailed(false);

    try {
      await logoutSession();
      router.replace(successHref);
      router.refresh();
    } catch (error) {
      setFailed(error instanceof AuthClientError || error instanceof Error);
    } finally {
      active.current = false;
      setSubmitting(false);
    }
  }

  return { submitting, failed, logout };
}
