import { Injectable } from '@nestjs/common';
import {
  EmailAlreadyExistsError,
  type AuthRepository,
  type NewSessionRecord,
  type NewUserRecord,
  type SafeUser,
  type UserCredentials,
} from '@mr-booking/auth-domain';
import { DatabaseService } from '@mr-booking/shared-database';
import { and, eq, gt } from 'drizzle-orm';
import { sessions, users } from './auth-schema';

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

    return result ?? null;
  }

  public deleteSession(tokenHash: string): void {
    this.databaseService.connection.drizzle
      .delete(sessions)
      .where(eq(sessions.tokenHash, tokenHash))
      .run();
  }
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
