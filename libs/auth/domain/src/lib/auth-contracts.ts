export interface SafeUser {
  readonly id: string;
  readonly name: string;
  readonly email: string;
}

export interface UserCredentials extends SafeUser {
  readonly passwordHash: string;
}

export interface NewUserRecord extends UserCredentials {
  readonly normalizedEmail: string;
  readonly createdAtUtc: number;
}

export interface NewSessionRecord {
  readonly id: string;
  readonly userId: string;
  readonly tokenHash: string;
  readonly createdAtUtc: number;
  readonly expiresAtUtc: number;
}

export interface AuthenticationResult {
  readonly user: SafeUser;
  readonly rawSessionToken: string;
  readonly expiresAtUtc: number;
}

export function toSafeUser(user: UserCredentials): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}
