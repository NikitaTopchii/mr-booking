import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type {
  Clock,
  IdGenerator,
  PasswordHasher,
  SessionTokenGenerator,
  SessionTokenHasher,
} from '@mr-booking/auth-domain';
import * as argon2 from 'argon2';

@Injectable()
export class Argon2PasswordHasher implements PasswordHasher {
  public async hash(password: string): Promise<string> {
    return argon2.hash(password, { type: argon2.argon2id });
  }

  public async verify(
    passwordHash: string,
    password: string,
  ): Promise<boolean> {
    return argon2.verify(passwordHash, password);
  }
}

@Injectable()
export class CryptoSessionTokenGenerator implements SessionTokenGenerator {
  public generate(): string {
    return randomBytes(32).toString('base64url');
  }
}

@Injectable()
export class Sha256SessionTokenHasher implements SessionTokenHasher {
  public hash(rawToken: string): string {
    return createHash('sha256').update(rawToken, 'utf8').digest('hex');
  }
}

@Injectable()
export class SystemClock implements Clock {
  public now(): number {
    return Date.now();
  }
}

@Injectable()
export class UuidGenerator implements IdGenerator {
  public generate(): string {
    return randomUUID();
  }
}
