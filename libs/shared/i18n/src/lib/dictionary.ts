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
    readonly scheduleTitle: string;
    readonly scheduleDescription: string;
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
