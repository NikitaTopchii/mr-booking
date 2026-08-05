import type { ZonedDateTimeErrorCode } from './types/zoned-date-time.types';

export class ZonedDateTimeError extends Error {
  public constructor(public readonly code: ZonedDateTimeErrorCode) {
    super(code);
    this.name = 'ZonedDateTimeError';
  }
}
