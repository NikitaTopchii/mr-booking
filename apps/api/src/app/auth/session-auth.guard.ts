import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { UnauthenticatedError, type SafeUser } from '@mr-booking/auth-domain';
import { GetCurrentUserQuery } from '@mr-booking/auth-feature';
import type { Request } from 'express';
import type { AuthenticatedRequest } from './auth-request';
import { SessionCookieService } from './session-cookie.service';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  public constructor(
    private readonly queryBus: QueryBus,
    private readonly sessionCookie: SessionCookieService,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const rawSessionToken = this.sessionCookie.read(request);

    if (!rawSessionToken) {
      throw new UnauthenticatedError();
    }

    const user = await this.queryBus.execute<GetCurrentUserQuery, SafeUser>(
      new GetCurrentUserQuery(rawSessionToken),
    );
    (request as AuthenticatedRequest).authenticatedUser = user;

    return true;
  }
}
