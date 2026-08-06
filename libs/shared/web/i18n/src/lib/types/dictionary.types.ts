export interface AppDictionary {
  readonly metadata: {
    readonly description: string;
    readonly loginTitle: string;
    readonly registerTitle: string;
  };
  readonly common: {
    readonly serviceUnavailable: string;
    readonly networkError: string;
  };
  readonly auth: {
    readonly language: {
      readonly label: string;
      readonly ukrainian: string;
      readonly english: string;
    };
    readonly login: {
      readonly title: string;
      readonly description: string;
      readonly emailLabel: string;
      readonly passwordLabel: string;
      readonly submit: string;
      readonly submitting: string;
      readonly switchText: string;
      readonly switchAction: string;
    };
    readonly register: {
      readonly title: string;
      readonly description: string;
      readonly nameLabel: string;
      readonly emailLabel: string;
      readonly passwordLabel: string;
      readonly passwordHint: string;
      readonly submit: string;
      readonly submitting: string;
      readonly switchText: string;
      readonly switchAction: string;
    };
    readonly logout: {
      readonly action: string;
      readonly submitting: string;
      readonly error: string;
    };
    readonly errors: {
      readonly invalidCredentials: string;
      readonly unauthenticated: string;
      readonly serviceUnavailable: string;
      readonly network: string;
      readonly fields: {
        readonly NAME_REQUIRED: string;
        readonly EMAIL_REQUIRED: string;
        readonly EMAIL_INVALID: string;
        readonly PASSWORD_REQUIRED: string;
        readonly PASSWORD_LENGTH: string;
        readonly EMAIL_ALREADY_EXISTS: string;
      };
    };
  };
  readonly application: {
    readonly serviceUnavailableTitle: string;
    readonly serviceUnavailableDescription: string;
  };
  readonly appShell: {
    readonly productName: string;
    readonly skipToContent: string;
    readonly navigation: {
      readonly label: string;
      readonly schedule: string;
      readonly myBookings: string;
    };
    readonly userMenu: {
      readonly open: string;
      readonly signedInAs: string;
      readonly language: string;
      readonly logout: string;
      readonly loggingOut: string;
      readonly logoutError: string;
    };
  };
  readonly emailVerification: {
    readonly title: string;
    readonly description: string;
    readonly requiredBanner: string;
    readonly bookingBlocked: string;
    readonly verify: string;
    readonly verifying: string;
    readonly success: string;
    readonly alreadyVerified: string;
    readonly invalidOrExpired: string;
    readonly deliveryFailure: string;
    readonly missingToken: string;
    readonly ready: string;
    readonly resend: string;
    readonly resending: string;
    readonly resendSent: string;
    readonly resendRateLimited: string;
    readonly retryAfter: string;
    readonly openVerificationLink: string;
    readonly developmentLink: string;
    readonly returnToSchedule: string;
    readonly signInToResend: string;
    readonly retry: string;
  };
  readonly schedule: {
    readonly title: string;
    readonly description: string;
    readonly roomLabel: string;
    readonly previousWeek: string;
    readonly currentWeek: string;
    readonly nextWeek: string;
    readonly officeTimezoneIndicator: string;
    readonly timezoneAccessibilityDescription: string;
    readonly loadingRooms: string;
    readonly loadingSchedule: string;
    readonly emptyRooms: string;
    readonly emptySchedule: string;
    readonly minimumCapacityLabel: string;
    readonly minimumCapacityPlaceholder: string;
    readonly applyCapacityFilter: string;
    readonly clearCapacityFilter: string;
    readonly activeCapacity: string;
    readonly invalidCapacity: string;
    readonly noMatchingRooms: string;
    readonly filterButtonLabel: string;
    readonly currentFilterSummary: string;
    readonly retry: string;
    readonly available: string;
    readonly unavailable: string;
    readonly yourBooking: string;
    readonly bookedBy: string;
    readonly bookingTitle: string;
    readonly bookingDetails: string;
    readonly titleLabel: string;
    readonly startLabel: string;
    readonly endLabel: string;
    readonly roomDetailsLabel: string;
    readonly create: string;
    readonly creating: string;
    readonly cancel: string;
    readonly cancelBooking: string;
    readonly cancelling: string;
    readonly keepBooking: string;
    readonly close: string;
    readonly requiredTitle: string;
    readonly invalidEnd: string;
    readonly cancelConfirmation: string;
    readonly successCreated: string;
    readonly successCancelled: string;
    readonly mobile: {
      readonly selectedDate: string;
      readonly openCalendar: string;
      readonly previousMonth: string;
      readonly nextMonth: string;
      readonly today: string;
      readonly selectRoom: string;
      readonly changeRoom: string;
      readonly selectedRoom: string;
      readonly floor: string;
      readonly capacity: string;
      readonly noBookingsForDay: string;
      readonly browserTimezone: string;
    };
    readonly duration: {
      readonly label: string;
      readonly thirtyMinutes: string;
      readonly oneHour: string;
      readonly ninetyMinutes: string;
      readonly twoHours: string;
      readonly twoAndHalfHours: string;
      readonly threeHours: string;
      readonly threeAndHalfHours: string;
      readonly fourHours: string;
    };
    readonly accessibility: {
      readonly selectDay: string;
      readonly selectedDay: string;
      readonly currentDay: string;
      readonly currentTime: string;
      readonly bookingAtTime: string;
    };
    readonly errors: {
      readonly rooms: string;
      readonly schedule: string;
      readonly roomNotFound: string;
      readonly creation: {
        readonly conflict: string;
        readonly startNotInFuture: string;
        readonly outsideHours: string;
        readonly invalidDuration: string;
        readonly invalidSlotAlignment: string;
        readonly titleRequired: string;
        readonly titleTooLong: string;
        readonly validation: string;
        readonly roomNotFound: string;
        readonly emailVerificationRequired: string;
        readonly generic: string;
      };
      readonly cancellation: {
        readonly notCancellable: string;
        readonly forbidden: string;
        readonly notFound: string;
        readonly generic: string;
      };
    };
  };
  readonly myBookings: {
    readonly title: string;
    readonly description: string;
    readonly loading: string;
    readonly retry: string;
    readonly loadMore: string;
    readonly loadingMore: string;
    readonly endOfHistory: string;
    readonly upcoming: {
      readonly title: string;
      readonly emptyTitle: string;
      readonly emptyDescription: string;
      readonly error: string;
    };
    readonly past: {
      readonly title: string;
      readonly emptyTitle: string;
      readonly emptyDescription: string;
      readonly error: string;
      readonly loadMoreError: string;
    };
    readonly actions: {
      readonly viewSchedule: string;
      readonly openSchedule: string;
      readonly cancel: string;
    };
    readonly floor: string;
    readonly capacity: string;
    readonly statuses: {
      readonly UPCOMING: string;
      readonly IN_PROGRESS: string;
      readonly PAST: string;
    };
    readonly cancellation: {
      readonly title: string;
      readonly description: string;
      readonly consequence: string;
      readonly keep: string;
      readonly confirm: string;
      readonly confirming: string;
      readonly success: string;
      readonly errors: {
        readonly stale: string;
        readonly notCancellable: string;
        readonly unauthenticated: string;
        readonly service: string;
      };
    };
  };
}
