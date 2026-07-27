import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthDataAccessModule } from '@mr-booking/auth-data-access';
import { parseRuntimeEnvironment } from '@mr-booking/shared-config';
import {
  AUTH_SESSION_TTL_MILLISECONDS,
  GetCurrentUserHandler,
  LoginUserHandler,
  LogoutSessionHandler,
  RegisterUserHandler,
} from './auth-handlers';

const millisecondsPerDay = 24 * 60 * 60 * 1000;

@Module({
  imports: [CqrsModule, AuthDataAccessModule],
  providers: [
    RegisterUserHandler,
    LoginUserHandler,
    LogoutSessionHandler,
    GetCurrentUserHandler,
    {
      provide: AUTH_SESSION_TTL_MILLISECONDS,
      useFactory: () =>
        parseRuntimeEnvironment(process.env).SESSION_TTL_DAYS *
        millisecondsPerDay,
    },
  ],
  exports: [CqrsModule],
})
export class AuthFeatureModule {}
