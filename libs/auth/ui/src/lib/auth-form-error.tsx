import { Alert, AlertDescription } from '@mr-booking/shared-ui';
import { CircleAlert } from 'lucide-react';

export interface AuthFormErrorProps {
  readonly message: string;
}

export function AuthFormError({ message }: AuthFormErrorProps) {
  return (
    <Alert variant="destructive" aria-live="polite">
      <CircleAlert aria-hidden="true" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
