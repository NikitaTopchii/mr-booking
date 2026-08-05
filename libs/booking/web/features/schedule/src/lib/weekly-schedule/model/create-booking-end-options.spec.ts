import type { ScheduleBooking } from '@mr-booking/booking-data-access-web';
import { createBookingEndOptions } from './create-booking-end-options';
import type { ScheduleSlot } from '../types/schedule.types';

const SLOT_MS = 30 * 60_000;

describe('createBookingEndOptions', () => {
  it('returns consecutive options up to the four-hour maximum', () => {
    const slots = makeSlots('2030-06-03T07:00:00.000Z', 10);

    expect(createOptions(slots[0], slots)).toEqual([
      '2030-06-03T07:30:00.000Z',
      '2030-06-03T08:00:00.000Z',
      '2030-06-03T08:30:00.000Z',
      '2030-06-03T09:00:00.000Z',
      '2030-06-03T09:30:00.000Z',
      '2030-06-03T10:00:00.000Z',
      '2030-06-03T10:30:00.000Z',
      '2030-06-03T11:00:00.000Z',
    ]);
  });

  it.each([
    ['18:30', '2030-06-03T15:30:00.000Z', ['2030-06-03T16:00:00.000Z']],
    [
      '18:00',
      '2030-06-03T15:00:00.000Z',
      ['2030-06-03T15:30:00.000Z', '2030-06-03T16:00:00.000Z'],
    ],
    [
      '17:30',
      '2030-06-03T14:30:00.000Z',
      [
        '2030-06-03T15:00:00.000Z',
        '2030-06-03T15:30:00.000Z',
        '2030-06-03T16:00:00.000Z',
      ],
    ],
  ])(
    '%s produces only options ending by office close',
    (_label, start, expected) => {
      const slots = makeSlots(start, 3);

      expect(createOptions(slots[0], slots)).toEqual(expected);
    },
  );

  it('stops before an occupied slot and keeps an exact office-close end valid', () => {
    const slots = makeSlots('2030-06-03T15:00:00.000Z', 2);
    const booking = makeBooking(
      '2030-06-03T15:30:00.000Z',
      '2030-06-03T16:00:00.000Z',
    );

    expect(createOptions(slots[0], slots, [booking])).toEqual([
      '2030-06-03T15:30:00.000Z',
    ]);
  });

  it('stops before a later occupied slot and allows an adjacent booking', () => {
    const slots = makeSlots('2030-06-03T14:30:00.000Z', 4);
    const laterBooking = makeBooking(
      '2030-06-03T15:30:00.000Z',
      '2030-06-03T16:00:00.000Z',
    );
    const adjacentBooking = makeBooking(
      '2030-06-03T14:00:00.000Z',
      '2030-06-03T14:30:00.000Z',
    );

    expect(
      createOptions(slots[0], slots, [laterBooking, adjacentBooking]),
    ).toEqual(['2030-06-03T15:00:00.000Z', '2030-06-03T15:30:00.000Z']);
  });

  it('does not let another room block the selected room', () => {
    const slots = makeSlots('2030-06-03T07:00:00.000Z', 3);
    const otherRoomBooking = {
      ...makeBooking('2030-06-03T07:30:00.000Z', '2030-06-03T08:30:00.000Z'),
      roomId: 'room-2',
    };

    expect(createOptions(slots[0], slots, [otherRoomBooking])).toHaveLength(3);
  });

  it('requires the selected slot identity and office day to be present', () => {
    const slots = makeSlots('2030-06-03T07:00:00.000Z', 2);

    expect(createOptions({ ...slots[0]!, id: 'stale-slot' }, slots)).toEqual(
      [],
    );
    expect(
      createOptions({ ...slots[0]!, officeDate: '2030-06-04' }, slots),
    ).toEqual([]);
  });

  it('is stable for unsorted equivalent input and ignores malformed duplicates', () => {
    const slots = makeSlots('2030-06-03T07:00:00.000Z', 3);
    const malformed = {
      ...slots[1]!,
      id: 'malformed',
      startsAtUtc: Number.NaN,
    } as ScheduleSlot;
    const duplicate = { ...slots[1]! };
    const equivalent = slots.map((slot) => ({ ...slot }));

    expect(
      createOptions(slots[0], [malformed, duplicate, slots[2]!, slots[0]!]),
    ).toEqual(createOptions(equivalent[0], equivalent.slice().reverse()));
  });
});

function createOptions(
  selected: ScheduleSlot | undefined,
  slots: readonly ScheduleSlot[],
  bookings: readonly ScheduleBooking[] = [],
): readonly string[] {
  if (!selected) throw new Error('Expected a selected slot');
  return createBookingEndOptions({
    selectedSlot: selected,
    slots,
    bookings,
    roomId: 'room-1',
    maximumDurationSlots: 8,
  });
}

function makeSlots(startIso: string, count: number): readonly ScheduleSlot[] {
  const start = Date.parse(startIso);
  return Array.from({ length: count }, (_, index) => ({
    id: `2030-06-03:${start + index * SLOT_MS}`,
    officeDate: '2030-06-03',
    startsAtUtc: start + index * SLOT_MS,
    endsAtUtc: start + (index + 1) * SLOT_MS,
  }));
}

function makeBooking(startsAtUtc: string, endsAtUtc: string): ScheduleBooking {
  return {
    id: `${startsAtUtc}-${endsAtUtc}`,
    roomId: 'room-1',
    title: 'Occupied',
    startsAtUtc,
    endsAtUtc,
    author: { id: 'user-2', name: 'Bob' },
    isMine: false,
  };
}
