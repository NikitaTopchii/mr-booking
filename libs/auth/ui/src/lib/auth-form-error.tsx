import { Alert, AlertDescription } from '@mr-booking/shared-ui';
import { CircleAlert } from 'lucide-react';
import type { AuthFormErrorProps } from './types/auth-ui.types';

export function AuthFormError({ message }: AuthFormErrorProps) {
  return (
    <Alert variant="destructive" aria-live="polite">
      <CircleAlert aria-hidden="true" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
