import { Injectable } from '@nestjs/common';
import {
  EmailAlreadyExistsError,
  type AuthWriteTransaction,
  type EmailVerificationTokenRecord,
  type AuthRepository,
  type NewSessionRecord,
  type NewEmailVerificationTokenRecord,
  type NewUserRecord,
  type SafeUser,
  type UserCredentials,
} from '@mr-booking/auth-domain';
import {
  emailVerificationTokens,
  sessions,
  users,
} from '@mr-booking/auth-infrastructure/schema';
import { DatabaseService } from '@mr-booking/shared-database';
import { and, desc, eq, gt, isNull } from 'drizzle-orm';

@Injectable()
export class DrizzleAuthRepository implements AuthRepository {
  public constructor(private readonly databaseService: DatabaseService) {}

  public findUserCredentials(normalizedEmail: string): UserCredentials | null {
    const result = this.databaseService.connection.drizzle
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        passwordHash: users.passwordHash,
        emailVerifiedAtUtc: users.emailVerifiedAtUtc,
      })
      .from(users)
      .where(eq(users.normalizedEmail, normalizedEmail))
      .get();

    return result ?? null;
  }

  public normalizedEmailExists(normalizedEmail: string): boolean {
    const result = this.databaseService.connection.drizzle
      .select({ id: users.id })
      .from(users)
      .where(eq(users.normalizedEmail, normalizedEmail))
      .get();

    return result !== undefined;
  }

  public createUserAndSession(
    user: NewUserRecord,
    session: NewSessionRecord,
  ): void {
    try {
      this.databaseService.connection.withImmediateTransaction(() => {
        this.databaseService.connection.drizzle
          .insert(users)
          .values(user)
          .run();
        this.databaseService.connection.drizzle
          .insert(sessions)
          .values(session)
          .run();
      });
    } catch (error) {
      if (isNormalizedEmailConstraintFailure(error)) {
        throw new EmailAlreadyExistsError();
      }

      throw error;
    }
  }

  public createSession(session: NewSessionRecord): void {
    this.databaseService.connection.drizzle
      .insert(sessions)
      .values(session)
      .run();
  }

  public findActiveSessionUser(
    tokenHash: string,
    nowUtc: number,
  ): SafeUser | null {
    const result = this.databaseService.connection.drizzle
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        emailVerifiedAtUtc: users.emailVerifiedAtUtc,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(
        and(
          eq(sessions.tokenHash, tokenHash),
          gt(sessions.expiresAtUtc, nowUtc),
        ),
      )
      .get();

    return result ? toSafeUser(result) : null;
  }

  public deleteSession(tokenHash: string): void {
    this.databaseService.connection.drizzle
      .delete(sessions)
      .where(eq(sessions.tokenHash, tokenHash))
      .run();
  }

  public findUserById(userId: string): UserCredentials | null {
    const result = this.databaseService.connection.drizzle
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        passwordHash: users.passwordHash,
        emailVerifiedAtUtc: users.emailVerifiedAtUtc,
      })
      .from(users)
      .where(eq(users.id, userId))
      .get();

    return result ?? null;
  }

  public isEmailVerified(userId: string): boolean {
    const user = this.findUserById(userId);
    return user !== null && user.emailVerifiedAtUtc !== null;
  }

  public withImmediateTransaction<T>(
    operation: (transaction: AuthWriteTransaction) => T,
  ): T {
    return this.databaseService.connection.withImmediateTransaction(() =>
      operation(new DrizzleAuthWriteTransaction(this.databaseService)),
    );
  }
}

class DrizzleAuthWriteTransaction implements AuthWriteTransaction {
  public constructor(private readonly databaseService: DatabaseService) {}

  public findUserById(userId: string): UserCredentials | null {
    const result = this.databaseService.connection.drizzle
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        passwordHash: users.passwordHash,
        emailVerifiedAtUtc: users.emailVerifiedAtUtc,
      })
      .from(users)
      .where(eq(users.id, userId))
      .get();

    return result ?? null;
  }

  public findLatestEmailVerificationToken(
    userId: string,
  ): EmailVerificationTokenRecord | null {
    const result = this.databaseService.connection.drizzle
      .select()
      .from(emailVerificationTokens)
      .where(eq(emailVerificationTokens.userId, userId))
      .orderBy(desc(emailVerificationTokens.createdAtUtc))
      .limit(1)
      .get();

    return result ?? null;
  }

  public invalidateActiveEmailVerificationTokens(
    userId: string,
    invalidatedAtUtc: number,
  ): void {
    this.databaseService.connection.drizzle
      .update(emailVerificationTokens)
      .set({ invalidatedAtUtc })
      .where(
        and(
          eq(emailVerificationTokens.userId, userId),
          isNull(emailVerificationTokens.consumedAtUtc),
          isNull(emailVerificationTokens.invalidatedAtUtc),
        ),
      )
      .run();
  }

  public createEmailVerificationToken(
    token: NewEmailVerificationTokenRecord,
  ): void {
    this.databaseService.connection.drizzle
      .insert(emailVerificationTokens)
      .values(token)
      .run();
  }

  public consumeEmailVerificationToken(
    tokenHash: string,
    nowUtc: number,
  ): 'verified' | 'already-verified' | 'invalid' {
    const token = this.databaseService.connection.drizzle
      .select()
      .from(emailVerificationTokens)
      .where(eq(emailVerificationTokens.tokenHash, tokenHash))
      .get();

    if (
      !token ||
      token.consumedAtUtc !== null ||
      token.invalidatedAtUtc !== null ||
      token.expiresAtUtc <= nowUtc
    ) {
      return 'invalid';
    }

    const user = this.findUserById(token.userId);

    if (!user) {
      return 'invalid';
    }

    this.databaseService.connection.drizzle
      .update(emailVerificationTokens)
      .set({ consumedAtUtc: nowUtc })
      .where(
        and(
          eq(emailVerificationTokens.id, token.id),
          isNull(emailVerificationTokens.consumedAtUtc),
          isNull(emailVerificationTokens.invalidatedAtUtc),
        ),
      )
      .run();

    this.invalidateActiveEmailVerificationTokens(token.userId, nowUtc);

    if (user.emailVerifiedAtUtc !== null) {
      return 'already-verified';
    }

    this.databaseService.connection.drizzle
      .update(users)
      .set({ emailVerifiedAtUtc: nowUtc })
      .where(and(eq(users.id, token.userId), isNull(users.emailVerifiedAtUtc)))
      .run();

    return 'verified';
  }
}

function toSafeUser(user: {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly emailVerifiedAtUtc: number | null;
}): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerifiedAtUtc !== null,
  };
}

function isNormalizedEmailConstraintFailure(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const message = 'message' in error ? error.message : undefined;

  return (
    typeof code === 'string' &&
    code.startsWith('SQLITE_CONSTRAINT') &&
    typeof message === 'string' &&
    (message.includes('users.normalized_email') ||
      message.includes('users_normalized_email_unique'))
  );
}
