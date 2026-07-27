import type {
  NewSessionRecord,
  NewUserRecord,
  SafeUser,
  UserCredentials,
} from './auth-contracts';

export const AUTH_REPOSITORY = Symbol('AUTH_REPOSITORY');
export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');
export const SESSION_TOKEN_GENERATOR = Symbol('SESSION_TOKEN_GENERATOR');
export const SESSION_TOKEN_HASHER = Symbol('SESSION_TOKEN_HASHER');
export const AUTH_CLOCK = Symbol('AUTH_CLOCK');
export const AUTH_ID_GENERATOR = Symbol('AUTH_ID_GENERATOR');

export interface AuthRepository {
  findUserCredentials(normalizedEmail: string): UserCredentials | null;
  normalizedEmailExists(normalizedEmail: string): boolean;
  createUserAndSession(user: NewUserRecord, session: NewSessionRecord): void;
  createSession(session: NewSessionRecord): void;
  findActiveSessionUser(tokenHash: string, nowUtc: number): SafeUser | null;
  deleteSession(tokenHash: string): void;
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
