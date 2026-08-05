import { createScheduleSearchParams } from './schedule-navigation';

describe('schedule navigation', () => {
  it('preserves unrelated parameters and normalizes date with its week', () => {
    expect(
      createScheduleSearchParams('localeHint=en&roomId=old', {
        roomId: 'room-2',
        date: '2026-08-02',
      }).toString(),
    ).toBe('localeHint=en&roomId=room-2&date=2026-08-02&week=2026-07-27');
  });
});
