import { Injectable } from '@nestjs/common';
import type { PasswordHasher } from '@mr-booking/auth-domain';
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
