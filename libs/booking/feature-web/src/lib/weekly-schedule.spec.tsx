import {
  createBooking,
  listRoomBookings,
  listRooms,
} from '@mr-booking/booking-data-access-web';
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

  return {
    BookingClientError,
    bookingKeys: {
      rooms: () => ['booking', 'rooms'],
      schedule: (roomId: string, range: { fromUtc: string; toUtc: string }) => [
        'booking',
        'schedule',
        roomId,
        range.fromUtc,
        range.toUtc,
      ],
    },
    listRooms: jest.fn(),
    listRoomBookings: jest.fn(),
    createBooking: jest.fn(),
    cancelBooking: jest.fn(),
  };
});
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

const router = { push: jest.fn(), replace: jest.fn() };
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
  errors: {
    rooms: 'Rooms failed',
    schedule: 'Schedule failed',
    conflict: 'Conflict',
    past: 'Past',
    outsideHours: 'Outside hours',
    duration: 'Duration',
    validation: 'Validation',
    forbidden: 'Forbidden',
    notFound: 'Not found',
    generic: 'Generic error',
  },
};

describe('weekly schedule', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  it('renders the manual week and opens booking creation from a future slot', async () => {
    renderSchedule();

    expect(
      await screen.findByRole('heading', { name: 'Weekly schedule' }),
    ).toBeDefined();
    expect(
      (await screen.findByRole('combobox', { name: 'Meeting room' }))
        .textContent,
    ).toContain('Aquarium');
    const available = await screen.findAllByRole('gridcell', {
      name: /Available/,
    });

    fireEvent.click(available[0]!);
    expect(
      await screen.findByRole('dialog', { name: 'Book a meeting room' }),
    ).toBeDefined();
    expect(screen.getByLabelText('Meeting title')).toBeDefined();
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
    fireEvent.click(available[0]!);
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

  it('normalizes invalid week URL state to the browser-local Monday', async () => {
    jest
      .mocked(useSearchParams)
      .mockReturnValue(new URLSearchParams('roomId=room-1&week=not-a-week'));
    renderSchedule();

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith(
        expect.stringContaining('week=2029-11-26'),
        { scroll: false },
      ),
    );
    await screen.findByRole('combobox', { name: 'Meeting room' });
  });
});

function renderSchedule() {
  return render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <WeeklySchedule locale="en" messages={messages} />
    </SWRConfig>,
  );
}
