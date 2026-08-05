import { Input, Label } from '@mr-booking/shared-ui';
import type { AuthFieldProps } from './types/auth-ui.types';

export function AuthField({
  name,
  label,
  type = 'text',
  autoComplete,
  hint,
  error,
  disabled = false,
}: AuthFieldProps) {
  const inputId = `auth-${name}`;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="grid gap-2">
      <Label htmlFor={inputId}>{label}</Label>
      <Input
        id={inputId}
        name={name}
        type={type}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        disabled={disabled}
      />
      {hint ? (
        <p id={hintId} className="text-xs leading-5 text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          id={errorId}
          className="text-xs font-medium leading-5 text-destructive"
          aria-live="polite"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
