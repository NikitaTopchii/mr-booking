import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import type { AuthenticationResult, SafeUser } from '@mr-booking/auth-domain';
import {
  LoginUserCommand,
  LogoutSessionCommand,
  RegisterUserCommand,
} from '@mr-booking/auth-feature';
import type { Request, Response } from 'express';
import { AuthExceptionFilter } from './auth-exception.filter';
import { CurrentUser } from './auth-request';
import { SessionAuthGuard } from './session-auth.guard';
import { SessionCookieService } from './session-cookie.service';

@Controller('auth')
@UseFilters(AuthExceptionFilter)
export class AuthController {
  public constructor(
    private readonly commandBus: CommandBus,
    private readonly sessionCookie: SessionCookieService,
  ) {}

  @Post('register')
  public async register(
    @Body() input: unknown,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ readonly user: SafeUser }> {
    const result = await this.commandBus.execute<
      RegisterUserCommand,
      AuthenticationResult
    >(new RegisterUserCommand(input));

    this.sessionCookie.set(
      response,
      result.rawSessionToken,
      result.expiresAtUtc,
    );
    return { user: result.user };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
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
  public currentUser(@CurrentUser() user: SafeUser): {
    readonly user: SafeUser;
  } {
    return { user };
  }
}
