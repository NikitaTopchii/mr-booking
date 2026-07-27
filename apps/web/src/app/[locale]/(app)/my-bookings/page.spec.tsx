/** @jest-environment jsdom */

jest.mock('server-only', () => ({}));

import { render, screen } from '@testing-library/react';
import MyBookingsPage from './page';

describe('My bookings UI foundation', () => {
  it.each([
    {
      locale: 'uk',
      title: 'Мої бронювання',
      upcoming: 'Майбутніх бронювань поки немає.',
      past: 'Минулі бронювання з’являться тут.',
      action: 'Перейти до розкладу',
      href: '/uk/schedule',
    },
    {
      locale: 'en',
      title: 'My bookings',
      upcoming: 'You have no upcoming bookings yet.',
      past: 'Past bookings will appear here.',
      action: 'View schedule',
      href: '/en/schedule',
    },
  ] as const)(
    'renders deliberate $locale empty states without booking records',
    async ({ locale, title, upcoming, past, action, href }) => {
      render(
        await MyBookingsPage({
          params: Promise.resolve({ locale }),
        }),
      );

      expect(
        screen.getByRole('heading', { level: 1, name: title }),
      ).toBeDefined();
      expect(screen.getByText(upcoming)).toBeDefined();
      expect(screen.getByText(past)).toBeDefined();
      expect(
        screen.getByRole('link', { name: action }).getAttribute('href'),
      ).toBe(href);
      expect(screen.queryByRole('listitem')).toBeNull();
    },
  );
});
