import { Button } from '@mr-booking/shared-ui';
import { LogOut } from 'lucide-react';

export interface LogoutControlProps {
  readonly label: string;
  readonly submittingLabel: string;
  readonly submitting: boolean;
  readonly error?: string | undefined;
  readonly onLogout: () => void;
}

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
