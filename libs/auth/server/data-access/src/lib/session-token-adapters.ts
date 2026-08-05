import { createHash, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type {
  EmailVerificationTokenGenerator,
  EmailVerificationTokenHasher,
  SessionTokenGenerator,
  SessionTokenHasher,
} from '@mr-booking/auth-domain';

@Injectable()
export class CryptoSessionTokenGenerator implements SessionTokenGenerator {
  public generate(): string {
    return randomBytes(32).toString('base64url');
  }
}

@Injectable()
export class Sha256SessionTokenHasher implements SessionTokenHasher {
  public hash(rawToken: string): string {
    return createHash('sha256').update(rawToken, 'utf8').digest('hex');
  }
}

@Injectable()
export class CryptoEmailVerificationTokenGenerator implements EmailVerificationTokenGenerator {
  public generate(): string {
    return randomBytes(32).toString('base64url');
  }
}

@Injectable()
export class Sha256EmailVerificationTokenHasher implements EmailVerificationTokenHasher {
  public hash(rawToken: string): string {
    return createHash('sha256').update(rawToken, 'utf8').digest('hex');
  }
}
