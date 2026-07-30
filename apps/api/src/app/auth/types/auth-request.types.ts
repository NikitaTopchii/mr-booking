import type { SafeUser } from '@mr-booking/auth-domain';
import type { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  authenticatedUser: SafeUser;
}

export interface CurrentUserResponse {
  readonly user: SafeUser;
}
