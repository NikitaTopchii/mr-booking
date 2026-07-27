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
    readonly userMenuLabel: string;
    readonly protectedEyebrow: string;
    readonly scheduleTitle: string;
    readonly scheduleDescription: string;
  };
}
