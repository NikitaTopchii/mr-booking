import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import type {
  AuthenticationResult,
  EmailVerificationDeliveryResult,
  SafeUser,
} from '@mr-booking/auth-domain';
import {
  LoginUserCommand,
  LogoutSessionCommand,
  RegisterUserCommand,
  RequestEmailVerificationCommand,
  VerifyEmailCommand,
} from '@mr-booking/auth-feature';
import type { Request, Response } from 'express';
import { AuthExceptionFilter } from './auth-exception.filter';
import { CurrentUser } from './auth-request';
import { SessionAuthGuard } from './session-auth.guard';
import { SessionCookieService } from './session-cookie.service';
import type { CurrentUserResponse } from './types/auth-request.types';
import {
  emailVerificationLocaleSchema,
  requestEmailVerificationBodySchema,
  verifyEmailBodySchema,
} from './email-verification-api.schemas';

@Controller('auth')
@UseFilters(AuthExceptionFilter)
export class AuthController {
  public constructor(
    private readonly commandBus: CommandBus,
    private readonly sessionCookie: SessionCookieService,
  ) {}

  @Post('register')
  @Header('Cache-Control', 'private, no-store')
  public async register(
    @Body() input: unknown,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{
    readonly user: SafeUser;
    readonly emailVerification?: EmailVerificationDeliveryResult;
  }> {
    const result = await this.commandBus.execute<
      RegisterUserCommand,
      AuthenticationResult
    >(new RegisterUserCommand(input, readLocale(input)));

    this.sessionCookie.set(
      response,
      result.rawSessionToken,
      result.expiresAtUtc,
    );
    return {
      user: result.user,
      ...(result.emailVerification
        ? { emailVerification: result.emailVerification }
        : {}),
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'private, no-store')
  public async login(
    @Body() input: unknown,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ readonly user: SafeUser }> {
    const result = await this.commandBus.execute<
      LoginUserCommand,
      AuthenticationResult
    >(new LoginUserCommand(input));

    this.sessionCookie.set(
      response,
      result.rawSessionToken,
      result.expiresAtUtc,
    );
    return { user: result.user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Header('Cache-Control', 'private, no-store')
  public async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const rawSessionToken = this.sessionCookie.read(request);

    if (rawSessionToken) {
      await this.commandBus.execute(new LogoutSessionCommand(rawSessionToken));
    }

    this.sessionCookie.clear(response);
  }

  @Get('me')
  @UseGuards(SessionAuthGuard)
  @Header('Cache-Control', 'private, no-store')
  public currentUser(@CurrentUser() user: SafeUser): CurrentUserResponse {
    return { user };
  }

  @Post('email-verification/request')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionAuthGuard)
  @Header('Cache-Control', 'private, no-store')
  public async requestEmailVerification(
    @CurrentUser() user: SafeUser,
    @Body() rawBody: unknown,
  ) {
    const body = requestEmailVerificationBodySchema.parse(rawBody ?? {});
    return this.commandBus.execute(
      new RequestEmailVerificationCommand(
        user.id,
        body.locale ?? 'uk',
        'resend',
      ),
    );
  }

  @Post('email-verification/verify')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'private, no-store')
  public async verifyEmail(@Body() rawBody: unknown) {
    const body = verifyEmailBodySchema.parse(rawBody);
    return this.commandBus.execute(new VerifyEmailCommand(body.token));
  }
}

function readLocale(input: unknown): 'uk' | 'en' {
  if (typeof input !== 'object' || input === null || !('locale' in input)) {
    return 'uk';
  }

  const result = emailVerificationLocaleSchema.safeParse(input.locale);
  return result.success ? result.data : 'uk';
}
