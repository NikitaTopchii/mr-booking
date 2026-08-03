import {
  AuthClientError,
  loginUser,
  registerUser,
} from '@mr-booking/auth-data-access-web/client';
import type { AuthFormMessages } from '@mr-booking/auth-ui';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AuthForm } from './auth-form';
import type { AuthFormErrorMessages } from './types/auth-feature-web.types';

jest.mock('@mr-booking/auth-data-access-web/client', () => ({
  AuthClientError: jest.requireActual('@mr-booking/auth-data-access-web/client')
    .AuthClientError,
  loginUser: jest.fn(),
  registerUser: jest.fn(),
}));

const replace = jest.fn();
const refresh = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace, refresh }),
}));

const loginMock = jest.mocked(loginUser);
const registerMock = jest.mocked(registerUser);

const errorMessages: AuthFormErrorMessages = {
  invalidCredentials: 'The email or password is incorrect.',
  network: 'Check your connection and try again.',
  serviceUnavailable: 'The service is unavailable.',
  fields: {
    NAME_REQUIRED: 'Enter your name.',
    EMAIL_REQUIRED: 'Enter your email.',
    EMAIL_INVALID: 'Enter a valid email.',
    PASSWORD_REQUIRED: 'Enter your password.',
    PASSWORD_LENGTH: 'Use 8 to 72 characters.',
    EMAIL_ALREADY_EXISTS: 'This account already exists.',
  },
};

describe('web auth form orchestration', () => {
  beforeEach(() => {
    replace.mockReset();
    refresh.mockReset();
    loginMock.mockReset();
    registerMock.mockReset();
  });

  it('renders Ukrainian and English messages without embedded translations', () => {
    const { rerender } = renderLogin({
      emailLabel: 'Електронна пошта',
      passwordLabel: 'Пароль',
      submit: 'Увійти',
      submitting: 'Входимо…',
      switchText: 'Ще не маєте акаунта?',
      switchAction: 'Зареєструватися',
    });

    expect(screen.getByLabelText('Електронна пошта')).toBeDefined();

    rerender(
      loginForm({
        emailLabel: 'Email',
        passwordLabel: 'Password',
        submit: 'Sign in',
        submitting: 'Signing in…',
        switchText: 'Need an account?',
        switchAction: 'Register',
      }),
    );

    expect(screen.getByLabelText('Email')).toBeDefined();
    expect(
      screen.getByRole('link', { name: 'Register' }).getAttribute('href'),
    ).toBe('/en/register');
  });

  it('keeps field error codes in state and focuses the first invalid input', () => {
    renderLogin();

    fireEvent.submit(
      screen.getByRole('button', { name: 'Sign in' }).closest('form')!,
    );

    expect(screen.getByText('Enter your email.')).toBeDefined();
    expect(screen.getByText('Enter your password.')).toBeDefined();
    expect(document.activeElement).toBe(screen.getByLabelText('Email'));
    expect(loginMock).not.toHaveBeenCalled();
  });

  it('parses typed API errors outside the component and shows inline feedback', async () => {
    loginMock.mockRejectedValue(
      new AuthClientError('INVALID_CREDENTIALS', 401),
    );
    renderLogin();
    fillLogin();
    fireEvent.submit(
      screen.getByRole('button', { name: 'Sign in' }).closest('form')!,
    );

    expect(
      await screen.findByText('The email or password is incorrect.'),
    ).toBeDefined();
  });

  it('renders a duplicate-email field code with the active dictionary', async () => {
    registerMock.mockRejectedValue(
      new AuthClientError('EMAIL_ALREADY_EXISTS', 409, {
        email: 'EMAIL_ALREADY_EXISTS',
      }),
    );
    render(
      <AuthForm
        mode="register"
        messages={{
          nameLabel: 'Ім’я',
          emailLabel: 'Електронна пошта',
          passwordLabel: 'Пароль',
          passwordHint: 'Від 8 до 72 символів. Пробіли дозволені.',
          submit: 'Створити акаунт',
          submitting: 'Створюємо…',
          switchText: 'Вже маєте акаунт?',
          switchAction: 'Увійти',
        }}
        errorMessages={{
          ...errorMessages,
          fields: {
            ...errorMessages.fields,
            EMAIL_ALREADY_EXISTS:
              'Акаунт із цією електронною поштою вже існує.',
          },
        }}
        loginHref="/uk/login"
        registerHref="/uk/register"
        successHref="/uk/schedule"
      />,
    );

    fireEvent.change(screen.getByLabelText('Ім’я'), {
      target: { value: 'Олена' },
    });
    fireEvent.change(screen.getByLabelText('Електронна пошта'), {
      target: { value: 'alice@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Пароль'), {
      target: { value: 'password123' },
    });
    fireEvent.submit(
      screen.getByRole('button', { name: 'Створити акаунт' }).closest('form')!,
    );

    expect(
      await screen.findByText('Акаунт із цією електронною поштою вже існує.'),
    ).toBeDefined();
    expect(document.activeElement).toBe(
      screen.getByLabelText('Електронна пошта'),
    );
  });

  it('shows network failure and prevents duplicate submission', async () => {
    let rejectRequest: ((error: unknown) => void) | undefined;
    loginMock.mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          rejectRequest = reject;
        }),
    );
    renderLogin();
    fillLogin();
    const form = screen
      .getByRole('button', { name: 'Sign in' })
      .closest('form')!;

    fireEvent.submit(form);
    fireEvent.submit(form);

    expect(loginMock).toHaveBeenCalledTimes(1);
    rejectRequest?.(new AuthClientError('NETWORK_ERROR', undefined));
    expect(
      await screen.findByText('Check your connection and try again.'),
    ).toBeDefined();
  });

  it('uses replace and preserves the localized success route', async () => {
    loginMock.mockResolvedValue({
      user: {
        id: 'alice',
        name: 'Alice',
        email: 'alice@example.com',
        emailVerified: true,
      },
    });
    renderLogin();
    fillLogin();
    fireEvent.submit(
      screen.getByRole('button', { name: 'Sign in' }).closest('form')!,
    );

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/en/schedule');
    });
    expect(refresh).toHaveBeenCalled();
  });

  it('renders registration labels and hint and preserves its localized route', async () => {
    registerMock.mockResolvedValue({
      user: {
        id: 'new-user',
        name: 'New User',
        email: 'new@example.com',
        emailVerified: false,
      },
    });
    render(
      <AuthForm
        mode="register"
        messages={{
          nameLabel: 'Name',
          emailLabel: 'Email',
          passwordLabel: 'Password',
          passwordHint: 'Use 8–72 characters. Spaces are allowed.',
          submit: 'Create account',
          submitting: 'Creating…',
          switchText: 'Already have an account?',
          switchAction: 'Sign in',
        }}
        errorMessages={errorMessages}
        loginHref="/en/login"
        registerHref="/en/register"
        successHref="/en/schedule"
      />,
    );

    expect(
      screen.getByText('Use 8–72 characters. Spaces are allowed.'),
    ).toBeDefined();
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'New User' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'new@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: ' pass123 ' },
    });
    fireEvent.submit(
      screen.getByRole('button', { name: 'Create account' }).closest('form')!,
    );

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith(
        expect.objectContaining({ password: ' pass123 ' }),
        'uk',
      );
      expect(replace).toHaveBeenCalledWith('/en/schedule');
    });
  });
});

function renderLogin(
  messages = {
    emailLabel: 'Email',
    passwordLabel: 'Password',
    submit: 'Sign in',
    submitting: 'Signing in…',
    switchText: 'Need an account?',
    switchAction: 'Register',
  },
) {
  return render(loginForm(messages));
}

function loginForm(messages: AuthFormMessages) {
  return (
    <AuthForm
      mode="login"
      messages={messages}
      errorMessages={errorMessages}
      loginHref="/en/login"
      registerHref="/en/register"
      successHref="/en/schedule"
    />
  );
}

function fillLogin(): void {
  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: 'alice@example.com' },
  });
  fireEvent.change(screen.getByLabelText('Password'), {
    target: { value: 'password123' },
  });
}
