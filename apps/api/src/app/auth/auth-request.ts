import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { SafeUser } from '@mr-booking/auth-domain';
import type { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  authenticatedUser: SafeUser;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): SafeUser => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.authenticatedUser;
  },
);
