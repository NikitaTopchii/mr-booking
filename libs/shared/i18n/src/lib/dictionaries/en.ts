import type { AppDictionary } from '../dictionary';

export const dictionary = {
  metadata: {
    description: 'Simple meeting-room booking',
    loginTitle: 'Sign in · MR Booking',
    registerTitle: 'Register · MR Booking',
  },
  common: {
    serviceUnavailable:
      'The service is temporarily unavailable. Please try again in a minute.',
    networkError:
      'We could not connect to the service. Check your connection and try again.',
  },
  auth: {
    language: {
      label: 'Language',
      ukrainian: 'Українська',
      english: 'English',
    },
    login: {
      title: 'Welcome back',
      description: 'Sign in to continue to meeting-room booking.',
      emailLabel: 'Email',
      passwordLabel: 'Password',
      submit: 'Sign in',
      submitting: 'Signing in…',
      switchText: 'Need an account?',
      switchAction: 'Register',
    },
    register: {
      title: 'Create your account',
      description: 'One short step and your workspace schedule will be ready.',
      nameLabel: 'Name',
      emailLabel: 'Email',
      passwordLabel: 'Password',
      passwordHint: 'Use 8–72 characters. Spaces are allowed.',
      submit: 'Create account',
      submitting: 'Creating…',
      switchText: 'Already have an account?',
      switchAction: 'Sign in',
    },
    logout: {
      action: 'Sign out',
      submitting: 'Signing out…',
      error: 'We could not sign you out. Please try again.',
    },
    errors: {
      invalidCredentials: 'The email or password is incorrect.',
      unauthenticated: 'Sign in to continue.',
      serviceUnavailable:
        'The service is temporarily unavailable. Please try again in a minute.',
      network:
        'We could not connect to the service. Check your connection and try again.',
      fields: {
        NAME_REQUIRED: 'Enter your name.',
        EMAIL_REQUIRED: 'Enter your email.',
        EMAIL_INVALID: 'Enter a valid email.',
        PASSWORD_REQUIRED: 'Enter your password.',
        PASSWORD_LENGTH: 'Password must contain 8 to 72 characters.',
        EMAIL_ALREADY_EXISTS: 'An account with this email already exists.',
      },
    },
  },
  application: {
    serviceUnavailableTitle: 'Service temporarily unavailable',
    serviceUnavailableDescription:
      'We could not verify your session. Refresh this page in a minute.',
    userMenuLabel: 'Current user',
    protectedEyebrow: 'Protected area',
    scheduleTitle: 'The schedule is ready for the next phase',
    scheduleDescription:
      'Authentication works. Calendar and booking functionality will be implemented separately.',
  },
} satisfies AppDictionary;
