import { createScheduleViewModel } from './create-schedule-view-model';
import { createScheduleRange } from './schedule-range';

describe('createScheduleViewModel', () => {
  it('prepares parsed booking ranges and occupied slot lookup once', () => {
    const schedule = createScheduleRange(
      { year: 2030, month: 6, day: 3 },
      1,
      'Europe/Lisbon',
    );
    const booking = {
      id: 'booking-1',
      roomId: 'room-1',
      title: 'Planning',
      startsAtUtc: new Date(schedule.slots[0]?.startsAtUtc ?? 0).toISOString(),
      endsAtUtc: new Date(schedule.slots[1]?.endsAtUtc ?? 0).toISOString(),
      author: { id: 'user-1', name: 'Alice' },
      isMine: true,
    };
    const model = createScheduleViewModel({
      schedule,
      presentation: 'compact',
      bookings: [booking],
      now: Date.parse('2030-06-01T10:00:00.000Z'),
      browserTimeZone: 'Europe/Lisbon',
      locale: 'en',
    });

    expect(model.days).toHaveLength(1);
    expect(model.days[0]?.bookings[0]?.startsAt).toBe(
      Date.parse(booking.startsAtUtc),
    );
    expect(model.occupiedBySlotId.size).toBe(2);
    expect(model.firstFocusable).toBe(schedule.slots[2]?.id);
  });
});
