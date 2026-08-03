import {
  AuthClientError,
  loginUser,
  registerUser,
} from '@mr-booking/auth-data-access-web/client';
import type { AuthenticationResponse } from '@mr-booking/auth-data-access-web/client';
import {
  AuthValidationError,
  parseLoginInput,
  parseRegistrationInput,
  type AuthField,
  type AuthFieldErrorCode,
} from '@mr-booking/auth-domain';
import { AuthFormView } from '@mr-booking/auth-ui';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import type {
  AuthenticationInput,
  AuthFormProps,
  FormErrorCode,
} from './types/auth-feature-web.types';

export function AuthForm({
  mode,
  messages,
  errorMessages,
  loginHref,
  registerHref,
  successHref,
  locale = 'uk',
}: AuthFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const submissionActive = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<AuthField, AuthFieldErrorCode>>
  >({});
  const [formError, setFormError] = useState<FormErrorCode | null>(null);
  const isRegistration = mode === 'register';

  useEffect(() => {
    if (submitting) {
      return;
    }

    const firstField = (['name', 'email', 'password'] as const).find(
      (field) => fieldErrors[field],
    );

    if (firstField) {
      formRef.current
        ?.querySelector<HTMLInputElement>(`[name="${firstField}"]`)
        ?.focus();
    }
  }, [fieldErrors, submitting]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submissionActive.current) {
      return;
    }

    setFormError(null);
    setFieldErrors({});
    const form = new FormData(event.currentTarget);
    const input = {
      ...(isRegistration ? { name: String(form.get('name') ?? '') } : {}),
      email: String(form.get('email') ?? ''),
      password: String(form.get('password') ?? ''),
    };

    let authenticationRequest: (
      locale: 'uk' | 'en',
    ) => Promise<AuthenticationResponse>;

    try {
      authenticationRequest = createAuthenticationRequest(
        isRegistration,
        input,
      );
    } catch (error) {
      if (error instanceof AuthValidationError) {
        showFieldErrors(error.fields);
        return;
      }

      throw error;
    }

    submissionActive.current = true;
    setSubmitting(true);

    try {
      const authentication = await authenticationRequest(locale);

      const developmentVerificationUrl = isRegistration
        ? authentication.emailVerification?.developmentVerificationUrl
        : undefined;
      router.replace(developmentVerificationUrl ?? successHref);
      router.refresh();
    } catch (error) {
      if (error instanceof AuthClientError) {
        if (
          error.code === 'VALIDATION_ERROR' ||
          error.code === 'EMAIL_ALREADY_EXISTS'
        ) {
          showFieldErrors(error.fields);
        } else if (error.code === 'INVALID_CREDENTIALS') {
          setFormError('INVALID_CREDENTIALS');
        } else if (error.code === 'NETWORK_ERROR') {
          setFormError('NETWORK_ERROR');
        } else {
          setFormError('SERVICE_UNAVAILABLE');
        }
      } else {
        setFormError('SERVICE_UNAVAILABLE');
      }
    } finally {
      submissionActive.current = false;
      setSubmitting(false);
    }
  }

  function showFieldErrors(
    errors: Readonly<Partial<Record<AuthField, AuthFieldErrorCode>>>,
  ): void {
    setFieldErrors(errors);
  }

  const translatedFieldErrors = Object.fromEntries(
    Object.entries(fieldErrors).map(([field, code]) => [
      field,
      errorMessages.fields[code],
    ]),
  ) as Partial<Record<AuthField, string>>;
  const translatedFormError = formError
    ? {
        INVALID_CREDENTIALS: errorMessages.invalidCredentials,
        NETWORK_ERROR: errorMessages.network,
        SERVICE_UNAVAILABLE: errorMessages.serviceUnavailable,
      }[formError]
    : undefined;

  return (
    <AuthFormView
      mode={mode}
      messages={messages}
      switchHref={isRegistration ? loginHref : registerHref}
      formRef={formRef}
      onSubmit={handleSubmit}
      submitting={submitting}
      fieldErrors={translatedFieldErrors}
      formError={translatedFormError}
    />
  );
}

function createAuthenticationRequest(
  isRegistration: boolean,
  input: AuthenticationInput,
): (locale: 'uk' | 'en') => Promise<AuthenticationResponse> {
  if (isRegistration) {
    const validatedInput = parseRegistrationInput(input);
    return (locale) => registerUser(validatedInput, locale);
  }

  const validatedInput = parseLoginInput(input);
  return () => loginUser(validatedInput);
}
