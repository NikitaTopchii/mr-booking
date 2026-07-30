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
  },
  appShell: {
    productName: 'MR Booking',
    skipToContent: 'Skip to main content',
    navigation: {
      label: 'Primary navigation',
      schedule: 'Schedule',
      myBookings: 'My bookings',
    },
    userMenu: {
      open: 'Open user menu',
      signedInAs: 'Signed in as',
      language: 'Interface language',
      logout: 'Sign out',
      loggingOut: 'Signing out…',
      logoutError: 'We could not sign you out. Please try again.',
    },
  },
  schedule: {
    title: 'Weekly schedule',
    description:
      'Choose a room, find an available time, and book it in your local timezone.',
    roomLabel: 'Meeting room',
    previousWeek: 'Previous week',
    currentWeek: 'This week',
    nextWeek: 'Next week',
    officeHours: 'Office hours: 09:00–19:00 Europe/Kyiv',
    localTime: 'Times shown in your timezone',
    loadingRooms: 'Loading meeting rooms…',
    loadingSchedule: 'Loading the weekly schedule…',
    emptyRooms: 'No meeting rooms are available.',
    emptySchedule: 'No bookings this week. Available slots are ready to book.',
    retry: 'Try again',
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
    creating: 'Booking…',
    cancel: 'Cancel',
    cancelBooking: 'Cancel booking',
    cancelling: 'Cancelling…',
    keepBooking: 'Keep booking',
    close: 'Close dialog',
    requiredTitle: 'Enter a meeting title.',
    invalidEnd: 'Choose an end time after the start.',
    cancelConfirmation:
      'This will release the room for everyone. This action cannot be undone.',
    successCreated: 'Booking created.',
    successCancelled: 'Booking cancelled.',
    errors: {
      rooms: 'We could not load meeting rooms.',
      schedule: 'We could not load this schedule.',
      conflict: 'That time was just booked. The schedule has been refreshed.',
      past: 'Bookings must start in the future.',
      outsideHours: 'Choose a time within office hours.',
      duration: 'Bookings must use 30-minute time slots.',
      validation: 'Check the booking details and try again.',
      forbidden: 'Only the booking owner can cancel it.',
      notFound: 'That booking is no longer available.',
      generic: 'Something went wrong. Please try again.',
    },
  },
  myBookings: {
    title: 'My bookings',
    description:
      'Your upcoming and past meeting-room bookings will be collected here.',
    upcoming: {
      title: 'Upcoming',
      emptyTitle: 'You have no upcoming bookings yet.',
      emptyDescription:
        'Your nearest confirmed bookings will appear here once booking data is connected.',
    },
    past: {
      title: 'Past',
      emptyTitle: 'Past bookings will appear here.',
      emptyDescription:
        'History will be connected to authoritative booking data in a later phase.',
    },
    actions: {
      viewSchedule: 'View schedule',
    },
  },
} satisfies AppDictionary;
