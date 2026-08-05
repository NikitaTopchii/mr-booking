import type { NewSessionRecord } from '@mr-booking/auth-domain';

export interface IssuedSession {
  readonly rawSessionToken: string;
  readonly session: NewSessionRecord;
}
