import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthDataAccessModule } from '@mr-booking/auth-data-access';
import { parseRuntimeEnvironment } from '@mr-booking/shared-config';
import {
  AUTH_SESSION_TTL_MILLISECONDS,
  AUTH_EMAIL_VERIFICATION_CONFIGURATION,
  GetCurrentUserHandler,
  LoginUserHandler,
  LogoutSessionHandler,
  RequestEmailVerificationHandler,
  RegisterUserHandler,
  VerifyEmailHandler,
} from './auth-handlers';

const millisecondsPerDay = 24 * 60 * 60 * 1000;

@Module({
  imports: [CqrsModule, AuthDataAccessModule],
  providers: [
    RegisterUserHandler,
    LoginUserHandler,
    LogoutSessionHandler,
    GetCurrentUserHandler,
    RequestEmailVerificationHandler,
    VerifyEmailHandler,
    {
      provide: AUTH_SESSION_TTL_MILLISECONDS,
      useFactory: () =>
        parseRuntimeEnvironment(process.env).SESSION_TTL_DAYS *
        millisecondsPerDay,
    },
    {
      provide: AUTH_EMAIL_VERIFICATION_CONFIGURATION,
      useFactory: () => {
        const environment = parseRuntimeEnvironment(process.env);
        return {
          tokenTtlMilliseconds:
            environment.EMAIL_VERIFICATION_TOKEN_TTL_MINUTES * 60 * 1000,
          resendCooldownSeconds:
            environment.EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS,
          appPublicUrl: environment.APP_PUBLIC_URL,
          exposeDevelopmentVerificationLink:
            environment.NODE_ENV !== 'production' &&
            environment.EXPOSE_DEVELOPMENT_VERIFICATION_LINK,
        };
      },
    },
  ],
  exports: [CqrsModule],
})
export class AuthFeatureModule {}
