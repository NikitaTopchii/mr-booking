import { Injectable } from '@nestjs/common';
import type { Clock } from '@mr-booking/auth-domain';

@Injectable()
export class SystemClock implements Clock {
  public now(): number {
    return Date.now();
  }
}
