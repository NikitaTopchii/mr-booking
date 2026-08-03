import type {
  EmailVerificationEmail,
  EmailVerificationTokenRecord,
  NewSessionRecord,
  NewUserRecord,
  NewEmailVerificationTokenRecord,
  SafeUser,
  UserCredentials,
} from './auth-contracts';

export const AUTH_REPOSITORY = Symbol('AUTH_REPOSITORY');
export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');
export const SESSION_TOKEN_GENERATOR = Symbol('SESSION_TOKEN_GENERATOR');
export const SESSION_TOKEN_HASHER = Symbol('SESSION_TOKEN_HASHER');
export const AUTH_CLOCK = Symbol('AUTH_CLOCK');
export const AUTH_ID_GENERATOR = Symbol('AUTH_ID_GENERATOR');
export const EMAIL_VERIFICATION_TOKEN_GENERATOR = Symbol(
  'EMAIL_VERIFICATION_TOKEN_GENERATOR',
);
export const EMAIL_VERIFICATION_TOKEN_HASHER = Symbol(
  'EMAIL_VERIFICATION_TOKEN_HASHER',
);
export const EMAIL_VERIFICATION_DELIVERY = Symbol(
  'EMAIL_VERIFICATION_DELIVERY',
);
export const AUTH_VERIFICATION_STATUS_READER = Symbol(
  'AUTH_VERIFICATION_STATUS_READER',
);

export interface AuthRepository {
  findUserCredentials(normalizedEmail: string): UserCredentials | null;
  normalizedEmailExists(normalizedEmail: string): boolean;
  createUserAndSession(user: NewUserRecord, session: NewSessionRecord): void;
  createSession(session: NewSessionRecord): void;
  findActiveSessionUser(tokenHash: string, nowUtc: number): SafeUser | null;
  deleteSession(tokenHash: string): void;
  findUserById(userId: string): UserCredentials | null;
  withImmediateTransaction<T>(
    operation: (transaction: AuthWriteTransaction) => T,
  ): T;
}

export interface AuthWriteTransaction {
  findUserById(userId: string): UserCredentials | null;
  findLatestEmailVerificationToken(
    userId: string,
  ): EmailVerificationTokenRecord | null;
  invalidateActiveEmailVerificationTokens(
    userId: string,
    invalidatedAtUtc: number,
  ): void;
  createEmailVerificationToken(token: NewEmailVerificationTokenRecord): void;
  consumeEmailVerificationToken(
    tokenHash: string,
    nowUtc: number,
  ): 'verified' | 'already-verified' | 'invalid';
}

export interface EmailVerificationStatusReader {
  isEmailVerified(userId: string): boolean;
}

export interface EmailVerificationTokenGenerator {
  generate(): string;
}

export interface EmailVerificationTokenHasher {
  hash(rawToken: string): string;
}

export interface EmailVerificationDelivery {
  sendVerificationEmail(input: EmailVerificationEmail): Promise<void>;
}

export interface PasswordHasher {
  hash(password: string): Promise<string>;
  verify(passwordHash: string, password: string): Promise<boolean>;
}

export interface SessionTokenGenerator {
  generate(): string;
}

export interface SessionTokenHasher {
  hash(rawToken: string): string;
}

export interface Clock {
  now(): number;
}

export interface IdGenerator {
  generate(): string;
}
