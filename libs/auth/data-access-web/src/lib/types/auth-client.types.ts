import type {
  AuthErrorCode,
  AuthFieldErrorCode,
  SafeUser,
} from '@mr-booking/auth-domain';

export interface AuthenticationResponse {
  readonly user: SafeUser;
}

export type AuthClientErrorCode = AuthErrorCode | 'NETWORK_ERROR';

export interface AuthFieldErrorPayload {
  readonly name?: AuthFieldErrorCode | undefined;
  readonly email?: AuthFieldErrorCode | undefined;
  readonly password?: AuthFieldErrorCode | undefined;
}
