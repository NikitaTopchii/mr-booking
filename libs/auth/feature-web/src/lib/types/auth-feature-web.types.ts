import type {
  AuthFieldErrorCode,
  LoginInput,
  RegistrationInput,
} from '@mr-booking/auth-domain';
import type { AuthFormMessages, AuthMode } from '@mr-booking/auth-ui';

export type FormErrorCode =
  'INVALID_CREDENTIALS' | 'NETWORK_ERROR' | 'SERVICE_UNAVAILABLE';

export interface AuthFormErrorMessages {
  readonly invalidCredentials: string;
  readonly network: string;
  readonly serviceUnavailable: string;
  readonly fields: Readonly<Record<AuthFieldErrorCode, string>>;
}

export interface AuthFormProps {
  readonly mode: AuthMode;
  readonly messages: AuthFormMessages;
  readonly errorMessages: AuthFormErrorMessages;
  readonly loginHref: string;
  readonly registerHref: string;
  readonly successHref: string;
}

export type AuthenticationInput = LoginInput | RegistrationInput;

export interface LogoutButtonProps {
  readonly label: string;
  readonly submittingLabel: string;
  readonly errorMessage: string;
  readonly successHref: string;
}

export interface LogoutState {
  readonly submitting: boolean;
  readonly failed: boolean;
  readonly logout: () => Promise<void>;
}
