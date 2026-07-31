import { Module } from '@nestjs/common';
import {
  AUTH_CLOCK,
  AUTH_ID_GENERATOR,
  AUTH_REPOSITORY,
  PASSWORD_HASHER,
  SESSION_TOKEN_GENERATOR,
  SESSION_TOKEN_HASHER,
} from '@mr-booking/auth-domain';
import { DrizzleAuthRepository } from './auth-repository';
import { AuthSeedService } from './auth-seed.service';
import { Argon2PasswordHasher } from './argon2-password-hasher';
import {
  CryptoSessionTokenGenerator,
  Sha256SessionTokenHasher,
} from './session-token-adapters';
import { SystemClock } from './system-clock';
import { UuidGenerator } from './uuid-generator';

const authPortProviders = [
  {
    provide: AUTH_REPOSITORY,
    useExisting: DrizzleAuthRepository,
  },
  {
    provide: PASSWORD_HASHER,
    useExisting: Argon2PasswordHasher,
  },
  {
    provide: SESSION_TOKEN_GENERATOR,
    useExisting: CryptoSessionTokenGenerator,
  },
  {
    provide: SESSION_TOKEN_HASHER,
    useExisting: Sha256SessionTokenHasher,
  },
  {
    provide: AUTH_CLOCK,
    useExisting: SystemClock,
  },
  {
    provide: AUTH_ID_GENERATOR,
    useExisting: UuidGenerator,
  },
] as const;

@Module({
  providers: [
    DrizzleAuthRepository,
    Argon2PasswordHasher,
    CryptoSessionTokenGenerator,
    Sha256SessionTokenHasher,
    SystemClock,
    UuidGenerator,
    AuthSeedService,
    ...authPortProviders,
  ],
  exports: [AuthSeedService, ...authPortProviders],
})
export class AuthDataAccessModule {}
