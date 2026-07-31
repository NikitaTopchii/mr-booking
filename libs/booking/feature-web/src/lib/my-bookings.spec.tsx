import {
  BookingClientError,
  cancelBooking,
  listMyPastBookings,
  listMyUpcomingBookings,
  type MyBooking,
} from '@mr-booking/booking-data-access-web';
import type { AppDictionary } from '@mr-booking/shared-i18n';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { SWRConfig } from 'swr';
import { MyBookings } from './my-bookings/my-bookings';

jest.mock('@mr-booking/booking-data-access-web', () => {
  class BookingClientError extends Error {
    public constructor(
      public readonly code: string,
      public readonly status?: number,
    ) {
      super(code);
    }
  }
  const listMyPastBookings = jest.fn();
  return {
    BookingClientError,
    bookingKeys: {
      mineUpcoming: () => ['booking', 'mine', 'upcoming'],
      minePast: (cursor: string | null, limit: number) => [
        'booking',
        'mine',
        'past',
        cursor,
        limit,
      ],
    },
    isScheduleKeyForRoom: jest.fn(() => false),
    listMyUpcomingBookings: jest.fn(),
    listMyPastBookings,
    fetchMyPastBookingsPage: jest.fn((key: readonly unknown[]) => {
      const [, , , cursor, limit] = key;
      return listMyPastBookings(cursor, limit);
    }),
    cancelBooking: jest.fn(),
  };
});
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const router = { replace: jest.fn() };
const room = { id: 'room-1', name: 'Aquarium', floor: 1, capacity: 4 };
const upcoming: MyBooking = {
  id: 'upcoming-1',
  title: 'Planning',
  startsAtUtc: '2030-06-03T07:00:00.000Z',
  endsAtUtc: '2030-06-03T08:00:00.000Z',
  room,
  status: 'UPCOMING',
  canCancel: true,
};
const pastBooking = (id: string): MyBooking => ({
  id,
  title: `Past ${id}`,
  startsAtUtc: '2030-05-27T07:00:00.000Z',
  endsAtUtc: '2030-05-27T08:00:00.000Z',
  room,
  status: 'PAST',
  canCancel: false,
});
const messages: AppDictionary['myBookings'] = {
  title: 'My bookings',
  description: 'Review meetings.',
  localTime: 'Times shown in',
  loading: 'Loading',
  retry: 'Retry',
  loadMore: 'Load more',
  loadingMore: 'Loading more',
  endOfHistory: 'End of history',
  upcoming: {
    title: 'Upcoming',
    emptyTitle: 'No upcoming',
    emptyDescription: 'Open schedule',
    error: 'Upcoming error',
  },
  past: {
    title: 'Past',
    emptyTitle: 'No past',
    emptyDescription: 'Past appears here',
    error: 'Past error',
    loadMoreError: 'Load more error',
  },
  actions: {
    viewSchedule: 'View schedule',
    openSchedule: 'Open in schedule',
    cancel: 'Cancel booking',
  },
  floor: 'Floor',
  capacity: 'people',
  statuses: {
    UPCOMING: 'Upcoming',
    IN_PROGRESS: 'In progress',
    PAST: 'Past',
  },
  cancellation: {
    title: 'Cancel booking?',
    description: 'Release room.',
    consequence: 'Removed from lists.',
    keep: 'Keep booking',
    confirm: 'Confirm cancellation',
    confirming: 'Cancelling',
    success: 'Booking cancelled.',
    errors: {
      stale: 'Stale',
      notCancellable: 'Started',
      unauthenticated: 'Sign in',
      service: 'Service error',
    },
  },
};

describe('my bookings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useRouter).mockReturnValue(router);
    jest.mocked(listMyUpcomingBookings).mockResolvedValue({
      items: [upcoming],
      serverNowUtc: '2030-06-03T06:00:00.000Z',
    });
    jest.mocked(listMyPastBookings).mockResolvedValue({
      items: [pastBooking('past-1')],
      serverNowUtc: '2030-06-03T06:00:00.000Z',
      nextCursor: null,
    });
    jest.mocked(cancelBooking).mockResolvedValue();
  });

  it('renders authoritative rows, local-week links, and confirms cancellation', async () => {
    renderMyBookings();

    expect(await screen.findByText('Planning')).toBeDefined();
    expect(await screen.findByText('Past past-1')).toBeDefined();
    expect(
      screen
        .getByRole('link', { name: 'Open in schedule: Planning' })
        .getAttribute('href'),
    ).toBe('/en/schedule?date=2030-06-03&week=2030-06-03&roomId=room-1');

    fireEvent.click(screen.getByRole('button', { name: 'Cancel booking' }));
    const dialog = screen.getByRole('dialog', { name: 'Cancel booking?' });
    expect(dialog).toBeDefined();
    expect(within(dialog).getByText('Aquarium')).toBeDefined();
    expect(within(dialog).getByText(/Jun 3, 2030 · .+–.+/)).toBeDefined();
    fireEvent.click(
      screen.getByRole('button', { name: 'Confirm cancellation' }),
    );

    await waitFor(() =>
      expect(cancelBooking).toHaveBeenCalledWith('upcoming-1'),
    );
    expect(await screen.findByText('Booking cancelled.')).toBeDefined();
    expect(listMyPastBookings).toHaveBeenCalledTimes(1);
  });

  it('loads unique cursor pages without discarding existing history', async () => {
    jest
      .mocked(listMyPastBookings)
      .mockResolvedValueOnce({
        items: [pastBooking('past-1')],
        serverNowUtc: '2030-06-03T06:00:00.000Z',
        nextCursor: 'next-page',
      })
      .mockResolvedValueOnce({
        items: [pastBooking('past-2')],
        serverNowUtc: '2030-06-03T06:00:00.000Z',
        nextCursor: null,
      });
    renderMyBookings();

    fireEvent.click(await screen.findByRole('button', { name: 'Load more' }));
    expect(await screen.findByText('Past past-2')).toBeDefined();
    expect(screen.getAllByText(/Past past-/)).toHaveLength(2);
    expect(listMyPastBookings).toHaveBeenLastCalledWith('next-page', 20);
  });

  it('keeps past data usable when upcoming fails', async () => {
    jest
      .mocked(listMyUpcomingBookings)
      .mockRejectedValue(new BookingClientError('SERVICE_UNAVAILABLE', 503));
    renderMyBookings();

    expect(await screen.findByText('Upcoming error')).toBeDefined();
    expect(await screen.findByText('Past past-1')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeDefined();
  });

  it('keeps loaded history visible and offers retry when a later page fails', async () => {
    jest
      .mocked(listMyPastBookings)
      .mockResolvedValueOnce({
        items: [pastBooking('past-1')],
        serverNowUtc: '2030-06-03T06:00:00.000Z',
        nextCursor: 'next-page',
      })
      .mockRejectedValueOnce(new BookingClientError('NETWORK_ERROR'));
    renderMyBookings();

    fireEvent.click(await screen.findByRole('button', { name: 'Load more' }));

    expect(await screen.findByText('Load more error')).toBeDefined();
    expect(screen.getByText('Past past-1')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeDefined();
  });

  it('redirects centrally when a query reports an expired session', async () => {
    jest
      .mocked(listMyUpcomingBookings)
      .mockRejectedValue(new BookingClientError('UNAUTHENTICATED', 401));
    renderMyBookings();

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith('/en/login'),
    );
    expect(await screen.findByText('Past past-1')).toBeDefined();
  });

  it('shows a stale cancellation cutoff error and refreshes upcoming', async () => {
    jest
      .mocked(cancelBooking)
      .mockRejectedValue(
        new BookingClientError('BOOKING_NOT_CANCELLABLE', 409),
      );
    renderMyBookings();

    await screen.findByText('Planning');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel booking' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Confirm cancellation' }),
    );

    expect(await screen.findByText('Started')).toBeDefined();
    await waitFor(() =>
      expect(listMyUpcomingBookings).toHaveBeenCalledTimes(2),
    );
  });
});

function renderMyBookings() {
  return render(
    <SWRConfig
      value={{
        provider: () => new Map(),
        dedupingInterval: 0,
        shouldRetryOnError: false,
      }}
    >
      <MyBookings locale="en" messages={messages} />
    </SWRConfig>,
  );
}
