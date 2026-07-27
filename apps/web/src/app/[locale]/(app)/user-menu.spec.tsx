/** @jest-environment jsdom */

import { useLogout } from '@mr-booking/auth-feature-web';
import { fireEvent, render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { UserMenu } from './user-menu';

jest.mock('@mr-booking/auth-feature-web', () => ({
  useLogout: jest.fn(),
}));
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

const logout = jest.fn();
const useLogoutMock = jest.mocked(useLogout);
const usePathnameMock = jest.mocked(usePathname);

describe('authenticated user menu', () => {
  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'hasPointerCapture', {
      configurable: true,
      value: () => false,
    });
    Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', {
      configurable: true,
      value: () => undefined,
    });
    Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', {
      configurable: true,
      value: () => undefined,
    });
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: () => undefined,
    });
  });

  beforeEach(() => {
    logout.mockReset();
    usePathnameMock.mockReturnValue('/uk/my-bookings');
    useLogoutMock.mockReturnValue({
      submitting: false,
      failed: false,
      logout,
    });
  });

  it('shows safe identity, preserves the current route by locale, and reuses logout orchestration', () => {
    renderMenu();

    const trigger = screen.getByRole('button', {
      name: 'Відкрити меню користувача: Олена Коваль',
    });
    fireEvent.keyDown(trigger, { key: 'Enter' });

    expect(screen.getAllByText('Олена Коваль')).toHaveLength(2);
    expect(screen.getByText('olena@example.com')).toBeDefined();
    expect(
      screen.getByRole('menuitem', { name: 'English' }).getAttribute('href'),
    ).toBe('/en/my-bookings');
    expect(
      screen
        .getByRole('menuitem', { name: 'Українська' })
        .getAttribute('aria-current'),
    ).toBe('page');

    fireEvent.click(screen.getByRole('menuitem', { name: 'Вийти' }));
    expect(logout).toHaveBeenCalledTimes(1);
    expect(useLogoutMock).toHaveBeenCalledWith('/uk/login');
  });

  it('communicates pending and failed logout state', () => {
    useLogoutMock.mockReturnValue({
      submitting: true,
      failed: true,
      logout,
    });
    renderMenu();

    fireEvent.keyDown(
      screen.getByRole('button', {
        name: 'Відкрити меню користувача: Олена Коваль',
      }),
      { key: 'Enter' },
    );

    expect(
      screen
        .getByRole('menuitem', { name: 'Виходимо…' })
        .getAttribute('data-disabled'),
    ).not.toBeNull();
    expect(screen.getByRole('status').textContent).toContain(
      'Не вдалося вийти',
    );
  });
});

function renderMenu() {
  return render(
    <UserMenu
      locale="uk"
      user={{
        id: 'olena',
        name: 'Олена Коваль',
        email: 'olena@example.com',
      }}
      loginHref="/uk/login"
      messages={{
        open: 'Відкрити меню користувача',
        signedInAs: 'Ви ввійшли як',
        language: 'Мова інтерфейсу',
        logout: 'Вийти',
        loggingOut: 'Виходимо…',
        logoutError: 'Не вдалося вийти. Спробуйте ще раз.',
        ukrainian: 'Українська',
        english: 'English',
      }}
    />,
  );
}
