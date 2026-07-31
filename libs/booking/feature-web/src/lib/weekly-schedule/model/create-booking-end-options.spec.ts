import type { ScheduleSlot } from '@mr-booking/booking-ui';
import { createBookingEndOptions } from './create-booking-end-options';

const slotStart = Date.parse('2030-06-03T07:00:00.000Z');
const slots: readonly ScheduleSlot[] = Array.from(
  { length: 10 },
  (_, index) => ({
    id: `slot-${index}`,
    officeDate: '2030-06-03',
    startsAtUtc: slotStart + index * 30 * 60_000,
    endsAtUtc: slotStart + (index + 1) * 30 * 60_000,
  }),
);

describe('createBookingEndOptions', () => {
  it('stops before the next occupied slot and caps duration at four hours', () => {
    const selected = slots[0];
    if (!selected) throw new Error('Expected a selected slot');

    expect(
      createBookingEndOptions(selected, slots, [
        {
          id: 'booking-1',
          roomId: 'room-1',
          title: 'Occupied',
          startsAtUtc: '2030-06-03T08:30:00.000Z',
          endsAtUtc: '2030-06-03T09:30:00.000Z',
          author: { id: 'user-1', name: 'Alice' },
          isMine: false,
        },
      ]),
    ).toEqual([
      '2030-06-03T07:30:00.000Z',
      '2030-06-03T08:00:00.000Z',
      '2030-06-03T08:30:00.000Z',
    ]);
  });

  it('returns no options for a slot outside the provided office-day sequence', () => {
    const selected = slots[0];
    if (!selected) throw new Error('Expected a selected slot');
    expect(
      createBookingEndOptions(
        { ...selected, officeDate: '2030-06-04' },
        slots,
        [],
      ),
    ).toEqual([]);
  });
});
