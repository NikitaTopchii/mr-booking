import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { AuthFormView } from './auth-form-view';
import { AuthLanguageSwitcher } from './auth-language-switcher';

describe('auth presentation', () => {
  it('composes shared accessible fields, errors, and disabled submit state', () => {
    render(
      <AuthFormView
        mode="login"
        messages={{
          emailLabel: 'Email',
          passwordLabel: 'Password',
          submit: 'Sign in',
          submitting: 'Signing in…',
          switchText: 'Need an account?',
          switchAction: 'Register',
        }}
        switchHref="/en/register"
        formRef={createRef<HTMLFormElement>()}
        onSubmit={jest.fn()}
        submitting
        fieldErrors={{ email: 'Enter a valid email.' }}
        formError="The email or password is incorrect."
      />,
    );

    const email = screen.getByLabelText('Email');
    const submit = screen.getByRole('button', { name: 'Signing in…' });

    expect(email.getAttribute('aria-invalid')).toBe('true');
    expect(email.getAttribute('aria-describedby')).toContain(
      'auth-email-error',
    );
    expect((submit as HTMLButtonElement).disabled).toBe(true);
    expect(
      screen.getByText('The email or password is incorrect.'),
    ).toBeDefined();
  });

  it('exposes an accessible active locale', () => {
    render(
      <AuthLanguageSwitcher
        label="Language"
        currentLocale="en"
        ukrainianLabel="Українська"
        englishLabel="English"
        ukrainianHref="/uk/login"
        englishHref="/en/login"
      />,
    );

    expect(
      screen
        .getByRole('link', { name: 'English' })
        .getAttribute('aria-current'),
    ).toBe('page');
    expect(screen.getByRole('link', { name: 'English' }).textContent).toBe(
      'en',
    );
    expect(
      screen.getByRole('link', { name: 'Українська' }).getAttribute('href'),
    ).toBe('/uk/login');
    expect(screen.getByRole('link', { name: 'Українська' }).textContent).toBe(
      'uk',
    );
  });
});
