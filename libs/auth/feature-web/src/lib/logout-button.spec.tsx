import { logoutSession } from '@mr-booking/auth-data-access-web/client';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { LogoutButton } from './logout-button';

jest.mock('@mr-booking/auth-data-access-web/client', () => ({
  AuthClientError: jest.requireActual('@mr-booking/auth-data-access-web/client')
    .AuthClientError,
  logoutSession: jest.fn(),
}));

const replace = jest.fn();
const refresh = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace, refresh }),
}));

const logoutSessionMock = jest.mocked(logoutSession);

describe('logout orchestration', () => {
  beforeEach(() => {
    replace.mockReset();
    refresh.mockReset();
    logoutSessionMock.mockReset();
  });

  it('prevents repeated requests and redirects through the localized route', async () => {
    let resolveRequest: (() => void) | undefined;
    logoutSessionMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveRequest = resolve;
        }),
    );
    renderLogout();

    const button = screen.getByRole('button', { name: 'Sign out' });
    fireEvent.click(button);
    fireEvent.click(button);

    expect(logoutSessionMock).toHaveBeenCalledTimes(1);
    expect(
      (
        screen.getByRole('button', {
          name: 'Signing out…',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);

    resolveRequest?.();
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/en/login');
    });
    expect(refresh).toHaveBeenCalled();
  });

  it('keeps the user in context and exposes a localized retry message on failure', async () => {
    logoutSessionMock.mockRejectedValue(new Error('network detail'));
    renderLogout();

    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(
      await screen.findByText('We could not sign you out. Try again.'),
    ).toBeDefined();
    expect(replace).not.toHaveBeenCalled();
  });
});

function renderLogout() {
  return render(
    <LogoutButton
      label="Sign out"
      submittingLabel="Signing out…"
      errorMessage="We could not sign you out. Try again."
      successHref="/en/login"
    />,
  );
}
