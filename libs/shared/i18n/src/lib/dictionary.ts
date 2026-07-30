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
  readonly schedule: {
    readonly title: string;
    readonly description: string;
    readonly roomLabel: string;
    readonly previousWeek: string;
    readonly currentWeek: string;
    readonly nextWeek: string;
    readonly officeHours: string;
    readonly localTime: string;
    readonly loadingRooms: string;
    readonly loadingSchedule: string;
    readonly emptyRooms: string;
    readonly emptySchedule: string;
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
    readonly errors: {
      readonly rooms: string;
      readonly schedule: string;
      readonly conflict: string;
      readonly past: string;
      readonly outsideHours: string;
      readonly duration: string;
      readonly validation: string;
      readonly forbidden: string;
      readonly notFound: string;
      readonly generic: string;
    };
  };
  readonly myBookings: {
    readonly title: string;
    readonly description: string;
    readonly upcoming: {
      readonly title: string;
      readonly emptyTitle: string;
      readonly emptyDescription: string;
    };
    readonly past: {
      readonly title: string;
      readonly emptyTitle: string;
      readonly emptyDescription: string;
    };
    readonly actions: {
      readonly viewSchedule: string;
    };
  };
}
