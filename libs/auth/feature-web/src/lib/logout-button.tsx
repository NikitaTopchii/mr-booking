import { LogoutControl } from '@mr-booking/auth-ui';
import { useLogout } from './use-logout';

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
