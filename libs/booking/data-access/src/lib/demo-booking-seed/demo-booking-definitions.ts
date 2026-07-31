import { DEMO_USER_IDS } from '@mr-booking/auth-domain';
import { DEMO_ROOM_IDS } from '@mr-booking/rooms-domain';
import type { DemoBookingDefinition } from './types/demo-booking-seed.types';

export const DEMO_BOOKING_IDS = {
  alicePlanning: 'demo-alice-planning',
  bobStandup: 'demo-bob-standup',
  aliceDesignReview: 'demo-alice-design-review',
  bobCustomerCall: 'demo-bob-customer-call',
  aliceRetrospective: 'demo-alice-retrospective',
  bobWeeklySync: 'demo-bob-weekly-sync',
} as const;

export const demoBookingIds: readonly string[] = Object.freeze(
  Object.values(DEMO_BOOKING_IDS),
);

export const demoBookingDefinitions: readonly DemoBookingDefinition[] = [
  {
    id: DEMO_BOOKING_IDS.alicePlanning,
    roomId: DEMO_ROOM_IDS.aquarium,
    authorUserId: DEMO_USER_IDS.alice,
    title: 'Weekly planning',
    dayOffset: 0,
    startHour: 10,
    startMinute: 0,
    durationMinutes: 60,
  },
  {
    id: DEMO_BOOKING_IDS.bobStandup,
    roomId: DEMO_ROOM_IDS.aquarium,
    authorUserId: DEMO_USER_IDS.bob,
    title: 'Team stand-up',
    dayOffset: 0,
    startHour: 11,
    startMinute: 0,
    durationMinutes: 60,
  },
  {
    id: DEMO_BOOKING_IDS.aliceDesignReview,
    roomId: DEMO_ROOM_IDS.mars,
    authorUserId: DEMO_USER_IDS.alice,
    title: 'Design review',
    dayOffset: 1,
    startHour: 14,
    startMinute: 0,
    durationMinutes: 90,
  },
  {
    id: DEMO_BOOKING_IDS.bobCustomerCall,
    roomId: DEMO_ROOM_IDS.aquarium,
    authorUserId: DEMO_USER_IDS.bob,
    title: 'Customer call',
    dayOffset: 2,
    startHour: 9,
    startMinute: 0,
    durationMinutes: 60,
  },
  {
    id: DEMO_BOOKING_IDS.aliceRetrospective,
    roomId: DEMO_ROOM_IDS.mars,
    authorUserId: DEMO_USER_IDS.alice,
    title: 'Sprint retrospective',
    dayOffset: 3,
    startHour: 16,
    startMinute: 0,
    durationMinutes: 120,
  },
  {
    id: DEMO_BOOKING_IDS.bobWeeklySync,
    roomId: DEMO_ROOM_IDS.aquarium,
    authorUserId: DEMO_USER_IDS.bob,
    title: 'Weekly sync',
    dayOffset: 4,
    startHour: 13,
    startMinute: 0,
    durationMinutes: 60,
  },
];
