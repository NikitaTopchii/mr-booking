import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@mr-booking/shared-database';
import { seedDemoBookings } from './demo-booking-seed/demo-booking-seed';
import type { DemoBookingSeedResult } from './demo-booking-seed/types/demo-booking-seed.types';

@Injectable()
export class DemoBookingSeedService {
  public constructor(private readonly databaseService: DatabaseService) {}

  public seed(weekStart?: string): DemoBookingSeedResult {
    return seedDemoBookings(this.databaseService.connection, weekStart);
  }
}
