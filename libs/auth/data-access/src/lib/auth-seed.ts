import { DEMO_USER_IDS, type PasswordHasher } from '@mr-booking/auth-domain';
import { users } from '@mr-booking/auth-infrastructure';
import type { DatabaseConnection } from '@mr-booking/shared-database';
import { eq } from 'drizzle-orm';

const seededUsers = [
  {
    id: DEMO_USER_IDS.alice,
    name: 'Alice',
    email: 'alice@example.com',
    normalizedEmail: 'alice@example.com',
  },
  {
    id: DEMO_USER_IDS.bob,
    name: 'Bob',
    email: 'bob@example.com',
    normalizedEmail: 'bob@example.com',
  },
] as const;

const seededAtUtc = Date.UTC(2026, 0, 1);

export async function seedAuthUsers(
  connection: DatabaseConnection,
  passwordHasher: PasswordHasher,
): Promise<void> {
  for (const user of seededUsers) {
    const existing = connection.drizzle
      .select({ id: users.id })
      .from(users)
      .where(eq(users.normalizedEmail, user.normalizedEmail))
      .get();

    if (existing) {
      continue;
    }

    const passwordHash = await passwordHasher.hash('password123');
    connection.drizzle
      .insert(users)
      .values({
        ...user,
        passwordHash,
        createdAtUtc: seededAtUtc,
      })
      .onConflictDoNothing({ target: users.normalizedEmail })
      .run();
  }
}
