/** @jest-environment jsdom */

import type { MyBookingsProps } from '@mr-booking/booking-feature-my-bookings';

jest.mock('server-only', () => ({}));
jest.mock('@mr-booking/booking-feature-my-bookings', () => ({
  MyBookings: ({ locale, messages }: MyBookingsProps) => (
    <div data-locale={locale}>{messages.title}</div>
  ),
}));

import { render, screen } from '@testing-library/react';
import MyBookingsPage from './page';

describe('My bookings page composition', () => {
  it.each([
    ['uk', 'Мої бронювання'],
    ['en', 'My bookings'],
  ] as const)(
    'passes the localized dictionary slice for %s',
    async (locale, title) => {
      render(
        await MyBookingsPage({
          params: Promise.resolve({ locale }),
        }),
      );

      expect(screen.getByText(title).getAttribute('data-locale')).toBe(locale);
    },
  );
});
