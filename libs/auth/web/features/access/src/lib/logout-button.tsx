import { LogoutControl } from '@mr-booking/auth-ui';
import type { LogoutButtonProps } from './types/auth-feature-access.types';
import { useLogout } from './use-logout';

export function LogoutButton({
  label,
  submittingLabel,
  errorMessage,
  successHref,
}: LogoutButtonProps) {
  const { submitting, failed, logout } = useLogout(successHref);

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
