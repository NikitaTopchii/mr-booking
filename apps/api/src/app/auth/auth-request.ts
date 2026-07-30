import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { SafeUser } from '@mr-booking/auth-domain';
import type { AuthenticatedRequest } from './types/auth-request.types';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): SafeUser => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.authenticatedUser;
  },
);
