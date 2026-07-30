import { Button } from '@mr-booking/shared-ui';
import { LogOut } from 'lucide-react';
import type { LogoutControlProps } from './types/auth-ui.types';

export function LogoutControl({
  label,
  submittingLabel,
  submitting,
  error,
  onLogout,
}: LogoutControlProps) {
  return (
    <div className="flex flex-col items-end gap-1.5">
      <Button
        type="button"
        variant="secondary"
        onClick={onLogout}
        disabled={submitting}
      >
        <LogOut aria-hidden="true" />
        {submitting ? submittingLabel : label}
      </Button>
      {error ? (
        <span
          className="max-w-56 text-right text-xs font-medium text-destructive"
          role="status"
        >
          {error}
        </span>
      ) : null}
    </div>
  );
}
