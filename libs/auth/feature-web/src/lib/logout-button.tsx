import {
  AuthClientError,
  logoutSession,
} from '@mr-booking/auth-data-access-web/client';
import { LogoutControl } from '@mr-booking/auth-ui';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

export interface LogoutButtonProps {
  readonly label: string;
  readonly submittingLabel: string;
  readonly errorMessage: string;
  readonly successHref: string;
}

export function LogoutButton({
  label,
  submittingLabel,
  errorMessage,
  successHref,
}: LogoutButtonProps) {
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

  return (
    <LogoutControl
      label={label}
      submittingLabel={submittingLabel}
      submitting={submitting}
      error={failed ? errorMessage : undefined}
      onLogout={() => void logout()}
    />
  );
}
