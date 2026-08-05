import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthDataAccessModule } from '@mr-booking/auth-data-access';
import {
  AUTH_EMAIL_VERIFICATION_CONFIGURATION,
  AUTH_SESSION_TTL_MILLISECONDS,
  GetCurrentUserHandler,
  LoginUserHandler,
  LogoutSessionHandler,
  RegisterUserHandler,
  RequestEmailVerificationHandler,
  VerifyEmailHandler,
} from '@mr-booking/auth-application';
import { parseRuntimeEnvironment } from '@mr-booking/shared-config';
import { AuthController } from './auth.controller';
import { SessionAuthGuard } from './session-auth.guard';
import { SessionCookieService } from './session-cookie.service';

const millisecondsPerDay = 24 * 60 * 60 * 1000;

@Module({
  imports: [CqrsModule, AuthDataAccessModule],
  controllers: [AuthController],
  providers: [
    SessionCookieService,
    SessionAuthGuard,
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
            environment.E2E_EMAIL_VERIFICATION_TOKEN_TTL_SECONDS !== undefined
              ? environment.E2E_EMAIL_VERIFICATION_TOKEN_TTL_SECONDS * 1000
              : environment.EMAIL_VERIFICATION_TOKEN_TTL_MINUTES * 60 * 1000,
          resendCooldownSeconds:
            environment.EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS,
          appPublicUrl: environment.APP_PUBLIC_URL,
          exposeDevelopmentVerificationLink:
            environment.EXPOSE_DEVELOPMENT_VERIFICATION_LINK,
        };
      },
    },
  ],
  exports: [SessionAuthGuard, SessionCookieService],
})
export class AuthModule {}
