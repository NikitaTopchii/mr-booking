import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@mr-booking/shared-database';
import { Argon2PasswordHasher } from './argon2-password-hasher';
import { seedAuthUsers } from './auth-seed';

@Injectable()
export class AuthSeedService {
  public constructor(
    private readonly databaseService: DatabaseService,
    private readonly passwordHasher: Argon2PasswordHasher,
  ) {}

  public async seed(): Promise<void> {
    await seedAuthUsers(this.databaseService.connection, this.passwordHasher);
  }
}
