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
jest.mock('@mr-booking/booking-ui', () => ({
  ...jest.requireActual('@mr-booking/booking-ui'),
  useBrowserTimeZone: () => mockBrowserTimeZone,
}));

const router = {
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  hmrRefresh: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
};
let viewportWidth = 375;
let mockBrowserTimeZone = 'Europe/Lisbon';
const messages: AppDictionary['schedule'] = {
  title: 'Schedule',
  description: '',
  roomLabel: 'Meeting room',
  previousWeek: 'Previous week',
  currentWeek: 'This week',
  nextWeek: 'Next week',
  officeTimezoneIndicator: 'Office timezone: Kyiv',
  timezoneAccessibilityDescription:
    'Schedule times are shown in your local timezone. Office-hour validation uses 09:00–19:00 Europe/Kyiv.',
  loadingRooms: 'Loading rooms',
  loadingSchedule: 'Loading schedule',
  emptyRooms: 'No rooms',
  emptySchedule: 'No bookings',
  minimumCapacityLabel: 'From people',
  minimumCapacityPlaceholder: 'People',
  applyCapacityFilter: 'Apply',
  clearCapacityFilter: 'Clear',
  activeCapacity: 'Capacity:',
  invalidCapacity: 'Enter a positive whole number of people.',
  noMatchingRooms: 'No rooms can accommodate at least {capacity} people.',
  filterButtonLabel: 'Filter by capacity',
  currentFilterSummary: 'At least {capacity} people',
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
  close: 'Close',
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
    browserTimezone: 'Time',
  },
  duration: {
    label: 'Duration',
    thirtyMinutes: '30 min',
    oneHour: '1 hour',
    ninetyMinutes: '1.5 hours',
    twoHours: '2 hours',
    twoAndHalfHours: '2.5 hours',
    threeHours: '3 hours',
    threeAndHalfHours: '3.5 hours',
    fourHours: '4 hours',
  },
  accessibility: {
    selectDay: 'Select',
    selectedDay: 'selected',
    currentDay: 'today',
    currentTime: 'Current time',
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
      titleRequired: 'Title required',
      titleTooLong: 'Title too long',
      validation: 'Validation',
      roomNotFound: 'Room not found',
      emailVerificationRequired: 'Email verification required',
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
    mockBrowserTimeZone = 'Europe/Lisbon';
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
    jest
      .mocked(useRouter)
      .mockReturnValue(router as ReturnType<typeof useRouter>);
    jest
      .mocked(useSearchParams)
      .mockReturnValue(createSearchParams('roomId=room-1&week=2030-06-03'));
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
      (await screen.findByTestId('mobile-room-summary')).textContent,
    ).toContain('Floor 2 · 6 people');
    expect(
      screen
        .getByRole('button', { name: /Selected room: Aquarium/u })
        .getAttribute('aria-expanded'),
    ).toBe('false');
    expect(
      document.querySelector('[data-schedule-presentation="compact"]'),
    ).toBeDefined();
    expect(
      await screen.findAllByRole('button', { name: /^Select /u }),
    ).toHaveLength(7);
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

  it('applies capacity and fallback room in one route transition', async () => {
    jest.mocked(listRooms).mockResolvedValue([
      { id: 'room-1', name: 'Aquarium', floor: 2, capacity: 4 },
      { id: 'room-2', name: 'Mars', floor: 3, capacity: 6 },
      { id: 'room-3', name: 'Orbit', floor: 4, capacity: 10 },
    ]);
    renderSchedule();

    await openMobileDock();
    const input = await screen.findByLabelText('From people');
    fireEvent.change(input, { target: { value: '6' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(router.push).toHaveBeenCalledWith(
      expect.stringMatching(
        /roomId=room-2.*week=2030-06-03.*date=2030-06-03.*minCapacity=6/u,
      ),
      { scroll: false },
    );
    expect((input as HTMLInputElement).value).toBe('6');
  });

  it('offers quick durations through four hours when the office window allows them', async () => {
    renderSchedule();
    const morningSlot = (
      await screen.findAllByRole('gridcell', { name: /Available/u })
    ).find((cell) => {
      const parts = getOfficeDateTimeParts(
        Number(cell.getAttribute('data-starts-at-utc')),
      );
      return parts.hour === 9 && parts.minute === 0;
    });
    if (!morningSlot) throw new Error('Expected a 09:00 office slot');

    fireEvent.click(morningSlot);

    expect(
      (await screen.findByRole('button', { name: '2.5 hours' })).hasAttribute(
        'disabled',
      ),
    ).toBe(false);
    expect(
      screen
        .getByRole('button', { name: '3.5 hours' })
        .hasAttribute('disabled'),
    ).toBe(false);
    expect(
      screen.getByRole('button', { name: '3 hours' }).hasAttribute('disabled'),
    ).toBe(false);
    expect(
      screen.getByRole('button', { name: '4 hours' }).hasAttribute('disabled'),
    ).toBe(false);
  });

  it('submits capacity with Enter exactly once through the canonical route', async () => {
    jest.mocked(listRooms).mockResolvedValue([
      { id: 'room-1', name: 'Aquarium', floor: 2, capacity: 4 },
      { id: 'room-2', name: 'Mars', floor: 3, capacity: 10 },
    ]);
    renderSchedule();

    await openMobileDock();
    const input = await screen.findByLabelText('From people');
    fireEvent.change(input, { target: { value: '10' } });
    const form = input.closest('form');
    if (!form) throw new Error('Expected capacity filter form');
    fireEvent.submit(form);

    expect(router.push).toHaveBeenCalledTimes(1);
    const href = router.push.mock.calls[0]?.[0] as string;
    const query = new URLSearchParams(href.slice(1));
    expect(query.get('minCapacity')).toBe('10');
    expect(query.get('roomId')).toBe('room-2');
    expect(query.get('date')).toBe('2030-06-03');
    expect(query.get('week')).toBe('2030-06-03');
  });

  it('normalizes a filtered-out selected room to the first matching room', async () => {
    jest
      .mocked(useSearchParams)
      .mockReturnValue(
        createSearchParams(
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
      (await screen.findByTestId('mobile-room-summary')).textContent,
    ).toContain('Mars');
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
        createSearchParams(
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
    await openMobileDock();
    expect(
      screen
        .getByRole('combobox', { name: 'Select meeting room' })
        .hasAttribute('disabled'),
    ).toBe(true);

    const clearButtons = screen.getAllByRole('button', {
      name: 'Clear',
    });
    const emptyState = screen
      .getByText('No rooms can accommodate at least 20 people.')
      .closest('[role="status"]');
    if (!emptyState) throw new Error('Expected no-match status');
    const clearButton = clearButtons[1] ?? clearButtons[0];
    if (!clearButton) throw new Error('Expected a clear filter button');
    fireEvent.click(emptyState.querySelector('button') ?? clearButton);
    expect(router.push).toHaveBeenCalledWith(
      expect.stringMatching(
        /date=2030-06-03.*week=2030-06-03(?!.*minCapacity)/u,
      ),
      { scroll: false },
    );
  });

  it('rejects decimal capacity input with an associated validation message', async () => {
    renderSchedule();
    await openMobileDock();
    const input = await screen.findByLabelText('From people');
    fireEvent.change(input, { target: { value: '4.5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(
      (
        await screen.findByText('Enter a positive whole number of people.')
      ).getAttribute('role'),
    ).toBe('alert');
    expect(router.push).not.toHaveBeenCalled();
    expect(
      screen
        .getByRole('button', { name: /Selected room: Aquarium/u })
        .getAttribute('aria-expanded'),
    ).toBe('true');
  });

  it('discloses compact room and filter controls with an accessible relationship', async () => {
    renderSchedule();

    const trigger = await openMobileDock();
    expect(trigger.getAttribute('aria-controls')).toBe(
      'mobile-schedule-control-dock-panel',
    );
    expect(
      screen.getByRole('combobox', { name: 'Select meeting room' }),
    ).toBeDefined();
    expect(screen.getByLabelText('From people')).toBeDefined();
    fireEvent.keyDown(
      document.getElementById('mobile-schedule-control-dock-panel')!,
      {
        key: 'Escape',
      },
    );
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger);
  });

  it('normalizes an invalid capacity URL value while preserving other query state', async () => {
    jest
      .mocked(useSearchParams)
      .mockReturnValue(
        createSearchParams(
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
    expect(
      document.querySelector('[data-schedule-toolbar="expanded"]'),
    ).not.toBeNull();
    expect(
      document.querySelector('[data-schedule-capacity-filter]'),
    ).not.toBeNull();
    expect(screen.getByRole('group', { name: 'This week' })).toBeDefined();
    expect(screen.getByText('Office timezone: Kyiv')).toBeDefined();
  });

  it('omits the office indicator when the browser uses Kyiv time', async () => {
    mockBrowserTimeZone = 'Europe/Kyiv';
    viewportWidth = 1440;
    renderSchedule();

    await screen.findByRole('grid', { name: 'Schedule' });
    expect(screen.queryByRole('note')).toBeNull();
  });

  it('exposes the current day and time with semantic visual-boundary hooks', async () => {
    jest.setSystemTime(new Date('2030-06-03T06:15:00.000Z'));
    viewportWidth = 1440;
    renderSchedule();

    const grid = await screen.findByRole('grid', { name: 'Schedule' });
    expect(grid.getAttribute('aria-describedby')).toBe(
      'schedule-current-time-expanded',
    );
    expect(
      document.getElementById('schedule-current-time-expanded')?.textContent,
    ).toContain('Current time: 07:15');
    expect(document.querySelector('[data-current-day="true"]')).not.toBeNull();
    expect(
      document.querySelector('[data-current-time-indicator]'),
    ).not.toBeNull();
    expect(
      document.querySelector('[data-time-boundary="hour"]'),
    ).not.toBeNull();
    expect(
      document.querySelector('[data-time-boundary="half-hour"]'),
    ).not.toBeNull();
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
      {
        id: 'booking-2',
        roomId: 'room-1',
        title: 'Room check',
        startsAtUtc: '2030-06-03T07:00:00.000Z',
        endsAtUtc: '2030-06-03T08:00:00.000Z',
        author: { id: 'user-2', name: 'Bob' },
        isMine: false,
      },
    ]);
    renderSchedule();
    const booking = await screen.findByRole('button', {
      name: /Design sync.*07:00–08:00.*Your booking/u,
    });
    expect(booking.style.gridColumn).toBe('1');
    expect(booking.getAttribute('data-booking-ownership')).toBe('mine');
    const foreignBooking = await screen.findByRole('button', {
      name: /Room check.*08:00–09:00.*Bob/u,
    });
    expect(foreignBooking.getAttribute('data-booking-ownership')).toBe(
      'foreign',
    );
    expect(foreignBooking.getAttribute('data-booking-author-color')).toBe(
      'terracotta',
    );
    expect(foreignBooking.textContent).toContain('Bob');
  });

  it('marks the grid with the selected directional week transition', async () => {
    renderSchedule();

    await screen.findByRole('grid', { name: 'Schedule' });
    fireEvent.click(screen.getByRole('button', { name: 'Next week' }));

    expect(
      document
        .querySelector('[data-schedule-wide-breakout]')
        ?.getAttribute('data-week-transition'),
    ).toBe('next');
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
    const titleInput = screen.getByLabelText('Meeting title');
    expect((titleInput as HTMLInputElement).value).toBe('Keep this title');
    expect(titleInput.getAttribute('aria-invalid')).toBeNull();
    expect(titleInput.getAttribute('aria-describedby')).toBeNull();
    expect(await screen.findByText('Conflict')).toBeDefined();
    await waitFor(() => expect(listRoomBookings).toHaveBeenCalledTimes(2));
  });

  it('associates and focuses a localized title error, then clears it on correction', async () => {
    renderSchedule();
    const available = await screen.findAllByRole('gridcell', {
      name: /Available/u,
    });
    const firstAvailable = available[0];
    if (!firstAvailable) throw new Error('Expected an available slot');
    fireEvent.click(firstAvailable);

    const title = await screen.findByLabelText('Meeting title');
    fireEvent.click(screen.getByRole('button', { name: 'Book room' }));

    await waitFor(() => {
      expect(document.activeElement).toBe(title);
      expect(title.getAttribute('aria-invalid')).toBe('true');
    });
    const describedBy = title.getAttribute('aria-describedby');
    expect(describedBy).toBe('booking-title-error');
    expect(document.getElementById(describedBy ?? '')?.textContent).toBe(
      'Title required',
    );
    expect(screen.getByText('Title required')).toBeDefined();

    fireEvent.change(title, { target: { value: 'Planning' } });

    await waitFor(() => {
      expect(title.getAttribute('aria-invalid')).toBeNull();
      expect(title.getAttribute('aria-describedby')).toBeNull();
    });
    expect(screen.queryByText('Title required')).toBeNull();
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
      .mockReturnValue(createSearchParams('roomId=room-1&week=not-a-week'));
    renderSchedule();

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith(
        expect.stringMatching(/week=2029-11-26.*date=2029-12-01/u),
        { scroll: false },
      ),
    );
    expect(router.replace).toHaveBeenCalledTimes(1);
    await screen.findByTestId('mobile-room-summary');
  });
});

function renderSchedule() {
  return render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <WeeklySchedule locale="en" messages={messages} />
    </SWRConfig>,
  );
}

async function openMobileDock(): Promise<HTMLButtonElement> {
  const trigger = await screen.findByRole('button', {
    name: /Selected room:/u,
  });
  fireEvent.click(trigger);
  expect(trigger.getAttribute('aria-expanded')).toBe('true');
  return trigger;
}

function createSearchParams(value: string): ReturnType<typeof useSearchParams> {
  return new URLSearchParams(value) as unknown as ReturnType<
    typeof useSearchParams
  >;
}
