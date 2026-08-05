import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { IdGenerator } from '@mr-booking/auth-domain';

@Injectable()
export class UuidGenerator implements IdGenerator {
  public generate(): string {
    return randomUUID();
  }
}
