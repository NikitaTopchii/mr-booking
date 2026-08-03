import { Logger, Module } from '@nestjs/common';
import {
  AUTH_CLOCK,
  AUTH_ID_GENERATOR,
  AUTH_REPOSITORY,
  AUTH_VERIFICATION_STATUS_READER,
  EMAIL_VERIFICATION_DELIVERY,
  EMAIL_VERIFICATION_TOKEN_GENERATOR,
  EMAIL_VERIFICATION_TOKEN_HASHER,
  PASSWORD_HASHER,
  SESSION_TOKEN_GENERATOR,
  SESSION_TOKEN_HASHER,
} from '@mr-booking/auth-domain';
import { parseRuntimeEnvironment } from '@mr-booking/shared-config';
import { DrizzleAuthRepository } from './auth-repository';
import { AuthSeedService } from './auth-seed.service';
import { Argon2PasswordHasher } from './argon2-password-hasher';
import {
  CryptoSessionTokenGenerator,
  CryptoEmailVerificationTokenGenerator,
  Sha256SessionTokenHasher,
  Sha256EmailVerificationTokenHasher,
} from './session-token-adapters';
import {
  DevelopmentEmailVerificationDelivery,
  DisabledEmailVerificationDelivery,
} from '@mr-booking/auth-infrastructure';
import { SystemClock } from './system-clock';
import { UuidGenerator } from './uuid-generator';

const authPortProviders = [
  {
    provide: AUTH_REPOSITORY,
    useExisting: DrizzleAuthRepository,
  },
  {
    provide: AUTH_VERIFICATION_STATUS_READER,
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
  {
    provide: EMAIL_VERIFICATION_TOKEN_GENERATOR,
    useExisting: CryptoEmailVerificationTokenGenerator,
  },
  {
    provide: EMAIL_VERIFICATION_TOKEN_HASHER,
    useExisting: Sha256EmailVerificationTokenHasher,
  },
  {
    provide: EMAIL_VERIFICATION_DELIVERY,
    useFactory: () => {
      const environment = parseRuntimeEnvironment(process.env);
      return environment.EMAIL_DELIVERY_MODE === 'development'
        ? new DevelopmentEmailVerificationDelivery(
            new Logger(DevelopmentEmailVerificationDelivery.name),
            environment.LOG_DEVELOPMENT_VERIFICATION_LINK,
          )
        : new DisabledEmailVerificationDelivery();
    },
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
    CryptoEmailVerificationTokenGenerator,
    Sha256EmailVerificationTokenHasher,
    AuthSeedService,
    ...authPortProviders,
  ],
  exports: [AuthSeedService, ...authPortProviders],
})
export class AuthDataAccessModule {}
