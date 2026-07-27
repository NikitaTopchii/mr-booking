/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { ApplicationNavigation } from './application-navigation';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

const usePathnameMock = jest.mocked(usePathname);

describe('authenticated application navigation', () => {
  beforeEach(() => {
    usePathnameMock.mockReturnValue('/uk/my-bookings');
  });

  it('renders locale-preserving primary destinations and marks the active route', () => {
    render(
      <ApplicationNavigation
        label="Основна навігація"
        schedule={{ href: '/uk/schedule', label: 'Розклад' }}
        myBookings={{
          href: '/uk/my-bookings',
          label: 'Мої бронювання',
        }}
      />,
    );

    expect(
      screen.getAllByRole('navigation', { name: 'Основна навігація' }),
    ).toHaveLength(2);

    for (const link of screen.getAllByRole('link', {
      name: 'Мої бронювання',
    })) {
      expect(link.getAttribute('href')).toBe('/uk/my-bookings');
      expect(link.getAttribute('aria-current')).toBe('page');
    }

    for (const link of screen.getAllByRole('link', { name: 'Розклад' })) {
      expect(link.getAttribute('href')).toBe('/uk/schedule');
      expect(link.getAttribute('aria-current')).toBeNull();
    }
  });

  it('uses the English labels and routes supplied by the server shell', () => {
    usePathnameMock.mockReturnValue('/en/schedule');

    render(
      <ApplicationNavigation
        label="Primary navigation"
        schedule={{ href: '/en/schedule', label: 'Schedule' }}
        myBookings={{ href: '/en/my-bookings', label: 'My bookings' }}
      />,
    );

    expect(
      screen
        .getAllByRole('link', { name: 'Schedule' })[0]
        ?.getAttribute('aria-current'),
    ).toBe('page');
    expect(
      screen
        .getAllByRole('link', { name: 'My bookings' })[0]
        ?.getAttribute('href'),
    ).toBe('/en/my-bookings');
  });
});
