import { officeDateTimeToUtcInstant } from '@mr-booking/booking-domain';
import type { DatabaseConnection } from '@mr-booking/shared-database';
import { demoBookingDefinitions } from './demo-booking-definitions';
import {
  createDemoBookingSeedPlan,
  resolveDemoSeedWeekStart,
} from './demo-booking-seed-plan';
import { persistDemoBookingSeed } from './demo-booking-seed.persistence';
import type { DemoBookingSeedResult } from './types/demo-booking-seed.types';

export function seedDemoBookings(
  connection: DatabaseConnection,
  configuredWeekStart?: string,
  nowUtc = Date.now(),
): DemoBookingSeedResult {
  const weekStart = resolveDemoSeedWeekStart(configuredWeekStart, nowUtc);
  const plan = createDemoBookingSeedPlan({
    definitions: demoBookingDefinitions,
    weekStart,
    validationNowUtc: nowUtc,
    toUtcInstant: officeDateTimeToUtcInstant,
  });

  persistDemoBookingSeed(connection, plan);

  return plan.summary;
}
