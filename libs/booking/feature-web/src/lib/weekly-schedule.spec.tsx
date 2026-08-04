import {
  BookingClientError,
  type BookingRange,
  createBooking,
  listRoomBookings,
  listRooms,
} from '@mr-booking/booking-data-access-web';
import { getOfficeDateTimeParts } from '@mr-booking/booking-domain';
import type { AppDictionary } from '@mr-booking/shared-i18n';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SWRConfig } from 'swr';
import { WeeklySchedule } from './weekly-schedule';

jest.mock('@mr-booking/booking-data-access-web', () => {
  class BookingClientError extends Error {
    public constructor(
      public readonly code: string,
      public readonly status?: number,
    ) {
      super(code);
    }
  }

  const listRoomBookings = jest.fn();
  return {
    BookingClientError,
    bookingKeys: {
      rooms: () => ['booking', 'rooms'],
      schedule: (roomId: string, range: BookingRange) => [
        'booking',
        'schedule',
        roomId,
        range.fromUtc,
        range.toUtc,
      ],
    },
    listRooms: jest.fn(),
    listRoomBookings,
    fetchRoomBookingsByKey: jest.fn((key: readonly unknown[]) => {
      const [, , roomId, fromUtc, toUtc] = key;
      return listRoomBookings(roomId, { fromUtc, toUtc });
    }),
    createBooking: jest.fn(),
    cancelBooking: jest.fn(),
  };
});
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));
jest.mock('./use-browser-time-zone', () => ({
  useBrowserTimeZone: () => 'Europe/Lisbon',
}));

const router = { push: jest.fn(), replace: jest.fn() };
let viewportWidth = 375;
const messages: AppDictionary['schedule'] = {
  title: 'Weekly schedule',
  description: 'Choose a room.',
  roomLabel: 'Meeting room',
  previousWeek: 'Previous week',
  currentWeek: 'This week',
  nextWeek: 'Next week',
  officeHours: 'Office hours',
  localTime: 'Local time',
  loadingRooms: 'Loading rooms',
  loadingSchedule: 'Loading schedule',
  emptyRooms: 'No rooms',
  emptySchedule: 'No bookings',
  minimumCapacityLabel: 'Minimum capacity',
  minimumCapacityPlaceholder: 'People',
  applyCapacityFilter: 'Apply filter',
  clearCapacityFilter: 'Clear filter',
  activeCapacity: 'Capacity filter active',
  invalidCapacity: 'Enter a positive whole number of people.',
  noMatchingRooms: 'No rooms can accommodate at least {capacity} people.',
  filterButtonLabel: 'Filter rooms by capacity',
  currentFilterSummary: 'Showing rooms for at least {capacity} people.',
  retry: 'Retry',
  available: 'Available',
  unavailable: 'Unavailable',
  yourBooking: 'Your booking',
  bookedBy: 'Booked by',
  bookingTitle: 'Book a meeting room',
  bookingDetails: 'Booking details',
  titleLabel: 'Meeting title',
  startLabel: 'Starts',
  endLabel: 'Ends',
  roomDetailsLabel: 'Room',
  create: 'Book room',
  creating: 'Booking',
  cancel: 'Cancel',
  cancelBooking: 'Cancel booking',
  cancelling: 'Cancelling',
  keepBooking: 'Keep booking',
  close: 'Close dialog',
  requiredTitle: 'Title required',
  invalidEnd: 'Invalid end',
  cancelConfirmation: 'Confirm cancellation',
  successCreated: 'Booking created',
  successCancelled: 'Booking cancelled',
  mobile: {
    selectedDate: 'Selected date',
    openCalendar: 'Open month calendar',
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    today: 'Today',
    selectRoom: 'Select meeting room',
    changeRoom: 'Change',
    selectedRoom: 'Selected room',
    floor: 'Floor',
    capacity: 'people',
    noBookingsForDay: 'No bookings for this day',
    browserTimezone: 'Your time',
    officeTimezone: 'Office hours',
    officeInterval: 'Kyiv',
  },
  duration: {
    label: 'Duration',
    thirtyMinutes: '30 min',
    oneHour: '1 hour',
    ninetyMinutes: '1.5 hours',
    twoHours: '2 hours',
    custom: 'Other end time',
  },
  accessibility: {
    selectDay: 'Select',
    selectedDay: 'selected',
    currentDay: 'today',
    bookingAtTime: 'Booking',
  },
  errors: {
    rooms: 'Rooms failed',
    schedule: 'Schedule failed',
    roomNotFound: 'Room not found',
    creation: {
      conflict: 'Conflict',
      startNotInFuture: 'Past',
      outsideHours: 'Outside hours',
      invalidDuration: 'Duration',
      invalidSlotAlignment: 'Slot alignment',
      invalidTitle: 'Title invalid',
      validation: 'Validation',
      roomNotFound: 'Room not found',
      generic: 'Generic error',
    },
    cancellation: {
      notCancellable: 'Not cancellable',
      forbidden: 'Forbidden',
      notFound: 'Not found',
      generic: 'Generic cancellation error',
    },
  },
};

describe('weekly schedule', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    viewportWidth = 375;
    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
      matches: query.includes('min-width: 1024')
        ? viewportWidth >= 1024
        : viewportWidth >= 640 && viewportWidth < 1024,
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
    jest.useFakeTimers().setSystemTime(new Date('2029-12-01T10:00:00.000Z'));
    router.push.mockReset();
    router.replace.mockReset();
    jest.mocked(useRouter).mockReturnValue(router);
    jest
      .mocked(useSearchParams)
      .mockReturnValue(new URLSearchParams('roomId=room-1&week=2030-06-03'));
    jest
      .mocked(listRooms)
      .mockResolvedValue([
        { id: 'room-1', name: 'Aquarium', floor: 2, capacity: 6 },
      ]);
    jest.mocked(listRoomBookings).mockResolvedValue([]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders one compact day with a seven-day strip and opens the booking sheet', async () => {
    renderSchedule();

    expect(
      (await screen.findByRole('combobox', { name: 'Select meeting room' }))
        .textContent,
    ).toContain('Change');
    expect(
      screen.getByRole('status', { name: 'Selected room: Aquarium' })
        .textContent,
    ).toContain('Floor 2 · 6 people');
    expect(
      document.querySelector('[data-schedule-presentation="compact"]'),
    ).toBeDefined();
    expect(screen.getAllByRole('button', { name: /^Select /u })).toHaveLength(
      7,
    );
    const available = await screen.findAllByRole('gridcell', {
      name: /Available/,
    });

    const firstAvailable = available[0];
    if (!firstAvailable) throw new Error('Expected an available slot');
    expect(firstAvailable.style.gridColumn).toBe('1');
    fireEvent.click(firstAvailable);
    expect(
      await screen.findByRole('dialog', { name: 'Book a meeting room' }),
    ).toBeDefined();
    expect(screen.getByLabelText('Meeting title')).toBeDefined();
    expect(screen.getByText('Duration')).toBeDefined();
  });

  it('applies a valid minimum capacity without changing the selected date', async () => {
    jest.mocked(listRooms).mockResolvedValue([
      { id: 'room-1', name: 'Aquarium', floor: 2, capacity: 4 },
      { id: 'room-2', name: 'Mars', floor: 3, capacity: 6 },
      { id: 'room-3', name: 'Orbit', floor: 4, capacity: 10 },
    ]);
    renderSchedule();

    const input = await screen.findByLabelText('Minimum capacity');
    fireEvent.change(input, { target: { value: '6' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply filter' }));

    expect(router.push).toHaveBeenCalledWith(
      expect.stringMatching(
        /roomId=room-1.*week=2030-06-03.*date=2030-06-03.*minCapacity=6/u,
      ),
      { scroll: false },
    );
    expect((input as HTMLInputElement).value).toBe('6');
  });

  it('normalizes a filtered-out selected room to the first matching room', async () => {
    jest
      .mocked(useSearchParams)
      .mockReturnValue(
        new URLSearchParams(
          'roomId=room-1&date=2030-06-03&week=2030-06-03&minCapacity=6',
        ),
      );
    jest.mocked(listRooms).mockResolvedValue([
      { id: 'room-1', name: 'Aquarium', floor: 2, capacity: 4 },
      { id: 'room-2', name: 'Mars', floor: 3, capacity: 6 },
      { id: 'room-3', name: 'Orbit', floor: 4, capacity: 10 },
    ]);
    renderSchedule();

    expect(
      await screen.findByRole('status', { name: 'Selected room: Mars' }),
    ).toBeDefined();
    expect(router.replace).toHaveBeenCalledWith(
      expect.stringMatching(/roomId=room-2.*minCapacity=6/u),
      { scroll: false },
    );
    expect(screen.queryByText('Aquarium')).toBeNull();
  });

  it('shows an accessible no-match state and does not fetch a room schedule', async () => {
    jest
      .mocked(useSearchParams)
      .mockReturnValue(
        new URLSearchParams(
          'roomId=room-1&date=2030-06-03&week=2030-06-03&minCapacity=20',
        ),
      );
    jest.mocked(listRooms).mockResolvedValue([
      { id: 'room-1', name: 'Aquarium', floor: 2, capacity: 4 },
      { id: 'room-2', name: 'Mars', floor: 3, capacity: 6 },
    ]);
    renderSchedule();

    expect(
      await screen.findByText('No rooms can accommodate at least 20 people.'),
    ).toBeDefined();
    expect(listRoomBookings).not.toHaveBeenCalled();
    expect(
      screen
        .getByRole('combobox', { name: 'Select meeting room' })
        .hasAttribute('disabled'),
    ).toBe(true);

    const clearButtons = screen.getAllByRole('button', {
      name: 'Clear filter',
    });
    const emptyState = screen
      .getByText('No rooms can accommodate at least 20 people.')
      .closest('[role="status"]');
    if (!emptyState) throw new Error('Expected no-match status');
    fireEvent.click(emptyState.querySelector('button') ?? clearButtons[1]);
    expect(router.push).toHaveBeenCalledWith(
      expect.stringMatching(
        /date=2030-06-03.*week=2030-06-03(?!.*minCapacity)/u,
      ),
      { scroll: false },
    );
  });

  it('rejects decimal capacity input with an associated validation message', async () => {
    renderSchedule();
    const input = await screen.findByLabelText('Minimum capacity');
    fireEvent.change(input, { target: { value: '4.5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply filter' }));

    expect(
      screen
        .getByText('Enter a positive whole number of people.')
        .getAttribute('role'),
    ).toBe('alert');
    expect(router.push).not.toHaveBeenCalled();
  });

  it('normalizes an invalid capacity URL value while preserving other query state', async () => {
    jest
      .mocked(useSearchParams)
      .mockReturnValue(
        new URLSearchParams(
          'roomId=room-1&date=2030-06-03&week=2030-06-03&minCapacity=4.5&unrelated=keep',
        ),
      );
    renderSchedule();

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith(
        expect.stringMatching(
          /roomId=room-1.*date=2030-06-03.*week=2030-06-03.*unrelated=keep/u,
        ),
        { scroll: false },
      ),
    );
    expect(router.replace.mock.calls[0]?.[0]).not.toContain('minCapacity');
    expect(router.replace).toHaveBeenCalledTimes(1);
  });

  it('reports a room query failure once and renders its safe message', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation();
    jest
      .mocked(listRooms)
      .mockRejectedValueOnce(
        new BookingClientError('SERVICE_UNAVAILABLE', 503),
      );

    renderSchedule();

    expect(await screen.findByText('Rooms failed')).toBeDefined();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      '[feature-error]',
      expect.objectContaining({
        feature: 'weeklySchedule',
        operation: 'loadRooms',
        context: expect.objectContaining({ operationAttempt: 1 }),
      }),
    );
    warn.mockRestore();
  });

  it('renders exactly three days at medium width', async () => {
    viewportWidth = 768;
    renderSchedule();
    await screen.findByRole('combobox', { name: 'Select meeting room' });
    const grid = await waitFor(() => {
      const result = document.querySelector(
        '[data-schedule-presentation="medium"]',
      );
      expect(result).not.toBeNull();
      return result;
    });
    expect(grid).not.toBeNull();
    expect(grid?.querySelector('[role="grid"]')?.children).toHaveLength(4);
  });

  it('preserves the expanded seven-day presentation', async () => {
    viewportWidth = 1440;
    renderSchedule();
    await screen.findByRole('combobox', { name: 'Select meeting room' });
    const grid = await waitFor(() => {
      const result = document.querySelector(
        '[data-schedule-presentation="expanded"]',
      );
      expect(result).not.toBeNull();
      return result;
    });
    expect(grid).not.toBeNull();
    expect(grid?.querySelector('[role="grid"]')?.children).toHaveLength(8);
  });

  it('updates selected date and normalized week from the compact strip', async () => {
    renderSchedule();
    const day = (
      await screen.findAllByRole('button', {
        name: /^Select /u,
      })
    )[1];
    if (!day) throw new Error('Expected a date-strip day');
    fireEvent.click(day);
    expect(router.push).toHaveBeenCalledWith(
      expect.stringMatching(/week=2030-06-03.*date=2030-06-04/u),
      { scroll: false },
    );
  });

  it('shows exact local booking time and text ownership in compact mode', async () => {
    jest.mocked(listRoomBookings).mockResolvedValue([
      {
        id: 'booking-1',
        roomId: 'room-1',
        title: 'Design sync',
        startsAtUtc: '2030-06-03T06:00:00.000Z',
        endsAtUtc: '2030-06-03T07:00:00.000Z',
        author: { id: 'user-1', name: 'Alice' },
        isMine: true,
      },
    ]);
    renderSchedule();
    const booking = await screen.findByRole('button', {
      name: /Design sync.*07:00–08:00.*Your booking/u,
    });
    expect(booking.style.gridColumn).toBe('1');
  });

  it('stops booking durations at the next occupied interval', async () => {
    jest.mocked(listRoomBookings).mockResolvedValue([
      {
        id: 'booking-next',
        roomId: 'room-1',
        title: 'Next meeting',
        startsAtUtc: '2030-06-03T08:00:00.000Z',
        endsAtUtc: '2030-06-03T09:00:00.000Z',
        author: { id: 'user-2', name: 'Bob' },
        isMine: false,
      },
    ]);
    renderSchedule();

    fireEvent.click(
      await screen.findByRole('gridcell', {
        name: /June 3, 2030.*08:30.*Available/u,
      }),
    );

    expect(
      screen.getByRole('button', { name: '30 min' }).hasAttribute('disabled'),
    ).toBe(false);
    expect(
      screen.getByRole('button', { name: '1 hour' }).hasAttribute('disabled'),
    ).toBe(true);
    expect(
      screen
        .getByRole('button', { name: '1.5 hours' })
        .hasAttribute('disabled'),
    ).toBe(true);
  });

  it('selects the only valid 30-minute duration for an 18:30 office slot', async () => {
    renderSchedule();
    const lateSlot = (
      await screen.findAllByRole('gridcell', {
        name: /Available/u,
      })
    ).find((cell) => {
      const startsAtUtc = Number(cell.getAttribute('data-starts-at-utc'));
      const parts = getOfficeDateTimeParts(startsAtUtc);
      return parts.hour === 18 && parts.minute === 30;
    });
    if (!lateSlot) throw new Error('Expected an 18:30 office slot');

    fireEvent.click(lateSlot);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: '30 min' }).hasAttribute('disabled'),
      ).toBe(false);
      expect(
        screen.getByRole('button', { name: '1 hour' }).hasAttribute('disabled'),
      ).toBe(true);
      expect(
        screen
          .getByRole('button', { name: '1.5 hours' })
          .hasAttribute('disabled'),
      ).toBe(true);
      expect(
        screen
          .getByRole('button', { name: '2 hours' })
          .hasAttribute('disabled'),
      ).toBe(true);
      expect(
        screen.getByRole('combobox', { name: 'Other end time' }).textContent,
      ).toMatch(/5:00 PM/u);
    });
    expect(screen.queryByText('Duration')).toBeDefined();
  });

  it('opens the month picker and selects a date', async () => {
    renderSchedule();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Open month calendar' }),
    );
    expect(
      await screen.findByRole('dialog', { name: 'Open month calendar' }),
    ).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: /June 12, 2030/u }));
    expect(router.push).toHaveBeenCalledWith(
      expect.stringMatching(/week=2030-06-10.*date=2030-06-12/u),
      { scroll: false },
    );
  });

  it('submits canonical ISO timestamps and refreshes the schedule', async () => {
    jest.mocked(createBooking).mockResolvedValue({
      id: 'booking-1',
      roomId: 'room-1',
      title: 'Planning',
      startsAtUtc: '2030-06-03T06:00:00.000Z',
      endsAtUtc: '2030-06-03T06:30:00.000Z',
      author: { id: 'user-1', name: 'Alice' },
      isMine: true,
    });
    renderSchedule();
    const available = await screen.findAllByRole('gridcell', {
      name: /Available/,
    });
    const firstAvailable = available[0];
    if (!firstAvailable) throw new Error('Expected an available slot');
    fireEvent.click(firstAvailable);
    fireEvent.change(await screen.findByLabelText('Meeting title'), {
      target: { value: 'Planning' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Book room' }));

    await waitFor(() => expect(createBooking).toHaveBeenCalledTimes(1));
    expect(jest.mocked(createBooking).mock.calls[0]?.[0]).toMatchObject({
      roomId: 'room-1',
      title: 'Planning',
      startsAtUtc: expect.stringMatching(/\.000Z$/),
      endsAtUtc: expect.stringMatching(/\.000Z$/),
    });
    expect(await screen.findByText('Booking created')).toBeDefined();
    await waitFor(() => expect(listRoomBookings).toHaveBeenCalledTimes(2));
  });

  it('keeps the creation form and its values after a booking conflict', async () => {
    jest
      .mocked(createBooking)
      .mockRejectedValueOnce(new BookingClientError('BOOKING_CONFLICT', 409));
    renderSchedule();
    const available = await screen.findAllByRole('gridcell', {
      name: /Available/u,
    });
    const firstAvailable = available[0];
    if (!firstAvailable) throw new Error('Expected an available slot');
    fireEvent.click(firstAvailable);
    const title = await screen.findByLabelText('Meeting title');
    fireEvent.change(title, { target: { value: 'Keep this title' } });
    fireEvent.click(screen.getByRole('button', { name: 'Book room' }));

    await waitFor(() => expect(createBooking).toHaveBeenCalledTimes(1));
    expect(
      screen.getByRole('dialog', { name: 'Book a meeting room' }),
    ).toBeDefined();
    expect(
      (screen.getByLabelText('Meeting title') as HTMLInputElement).value,
    ).toBe('Keep this title');
    expect(await screen.findByText('Conflict')).toBeDefined();
    await waitFor(() => expect(listRoomBookings).toHaveBeenCalledTimes(2));
  });

  it('moves medium-grid focus by row and column independently', async () => {
    viewportWidth = 768;
    renderSchedule();
    await screen.findByRole('combobox', { name: 'Select meeting room' });
    await screen.findAllByRole('gridcell');
    const firstDayFirstSlot = document.querySelector<HTMLButtonElement>(
      'button[role="gridcell"][data-column="0"][data-row="0"]',
    );
    if (!firstDayFirstSlot) throw new Error('Expected the first grid cell');
    firstDayFirstSlot.focus();

    fireEvent.keyDown(firstDayFirstSlot, { key: 'ArrowRight' });
    const nextDaySameRow = document.querySelector<HTMLButtonElement>(
      'button[role="gridcell"][data-column="1"][data-row="0"]',
    );
    expect(document.activeElement).toBe(nextDaySameRow);

    if (!nextDaySameRow) throw new Error('Expected the adjacent grid cell');
    fireEvent.keyDown(nextDaySameRow, { key: 'ArrowDown' });
    expect(document.activeElement?.getAttribute('data-column')).toBe('1');
    expect(document.activeElement?.getAttribute('data-row')).toBe('1');
  });

  it('normalizes invalid week URL state to the browser-local Monday', async () => {
    jest
      .mocked(useSearchParams)
      .mockReturnValue(new URLSearchParams('roomId=room-1&week=not-a-week'));
    renderSchedule();

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith(
        expect.stringMatching(/week=2029-11-26.*date=2029-12-01/u),
        { scroll: false },
      ),
    );
    expect(router.replace).toHaveBeenCalledTimes(1);
    await screen.findByRole('combobox', { name: 'Select meeting room' });
  });
});

function renderSchedule() {
  return render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <WeeklySchedule locale="en" messages={messages} />
    </SWRConfig>,
  );
}
