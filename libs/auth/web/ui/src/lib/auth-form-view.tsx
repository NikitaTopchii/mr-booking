import { Button, Spinner } from '@mr-booking/shared-ui';
import Link from 'next/link';
import { AuthField } from './auth-field';
import { AuthFormError } from './auth-form-error';
import type { AuthFormViewProps } from './types/auth-ui.types';

export function AuthFormView({
  mode,
  messages,
  switchHref,
  formRef,
  onSubmit,
  submitting,
  fieldErrors,
  formError,
}: AuthFormViewProps) {
  const isRegistration = mode === 'register';

  return (
    <form ref={formRef} className="grid gap-5" onSubmit={onSubmit} noValidate>
      {isRegistration && messages.nameLabel ? (
        <AuthField
          name="name"
          label={messages.nameLabel}
          autoComplete="name"
          error={fieldErrors.name}
          disabled={submitting}
        />
      ) : null}

      <AuthField
        name="email"
        label={messages.emailLabel}
        type="email"
        autoComplete="email"
        error={fieldErrors.email}
        disabled={submitting}
      />

      <AuthField
        name="password"
        label={messages.passwordLabel}
        type="password"
        autoComplete={isRegistration ? 'new-password' : 'current-password'}
        hint={messages.passwordHint}
        error={fieldErrors.password}
        disabled={submitting}
      />

      {formError ? <AuthFormError message={formError} /> : null}

      <Button
        type="submit"
        size="lg"
        disabled={submitting}
        aria-disabled={submitting}
        className="w-full"
      >
        {submitting ? (
          <>
            <Spinner />
            {messages.submitting}
          </>
        ) : (
          messages.submit
        )}
      </Button>

      <p className="text-center text-sm leading-6 text-muted-foreground">
        {messages.switchText}{' '}
        <Link
          href={switchHref}
          className="font-medium text-primary underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {messages.switchAction}
        </Link>
      </p>
    </form>
  );
}
