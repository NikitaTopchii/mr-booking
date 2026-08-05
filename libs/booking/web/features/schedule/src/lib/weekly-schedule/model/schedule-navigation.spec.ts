import {
  createScheduleSearchParams,
  parseScheduleRouteState,
  updateScheduleSearchParams,
} from './schedule-navigation';

describe('schedule navigation', () => {
  it('preserves unrelated parameters and normalizes date with its week', () => {
    expect(
      createScheduleSearchParams('localeHint=en&roomId=old', {
        roomId: 'room-2',
        date: '2026-08-02',
      }).toString(),
    ).toBe('localeHint=en&roomId=room-2&date=2026-08-02&week=2026-07-27');
  });

  it.each([
    ['missing', 'date=2030-06-03&week=2030-06-03', undefined],
    ['valid', 'minCapacity=10', 10],
    ['decimal', 'minCapacity=4.5', undefined],
    ['duplicate', 'minCapacity=10&minCapacity=20', 10],
  ])('parses %s minimum capacity route state', (_name, query, expected) => {
    expect(parseScheduleRouteState(query).minimumCapacity).toBe(expected);
  });

  it('applies capacity and room changes atomically while preserving route state', () => {
    const next = updateScheduleSearchParams(
      'localeHint=en&roomId=room-1&date=2030-06-03&week=2030-06-03',
      { minimumCapacity: 10, roomId: 'room-3' },
    );

    expect(next.get('localeHint')).toBe('en');
    expect(next.get('roomId')).toBe('room-3');
    expect(next.get('date')).toBe('2030-06-03');
    expect(next.get('week')).toBe('2030-06-03');
    expect(next.get('minCapacity')).toBe('10');
  });

  it('clears capacity without dropping the selected room or date state', () => {
    const next = updateScheduleSearchParams(
      'roomId=room-3&date=2030-06-03&week=2030-06-03&minCapacity=10',
      { minimumCapacity: null },
    );

    expect(next.get('roomId')).toBe('room-3');
    expect(next.get('date')).toBe('2030-06-03');
    expect(next.get('week')).toBe('2030-06-03');
    expect(next.has('minCapacity')).toBe(false);
  });
});
