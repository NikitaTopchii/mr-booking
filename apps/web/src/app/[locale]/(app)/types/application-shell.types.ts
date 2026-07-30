import type { SafeUser } from '@mr-booking/auth-domain';
import type { AppDictionary, Locale } from '@mr-booking/shared-i18n';
import type { ReactNode } from 'react';

export interface ApplicationNavigationProps {
  readonly label: string;
  readonly schedule: {
    readonly href: string;
    readonly label: string;
  };
  readonly myBookings: {
    readonly href: string;
    readonly label: string;
  };
}

export interface ApplicationShellProps {
  readonly locale: Locale;
  readonly user: SafeUser;
  readonly dictionary: AppDictionary;
  readonly children: ReactNode;
}

export interface UserMenuMessages {
  readonly open: string;
  readonly signedInAs: string;
  readonly language: string;
  readonly logout: string;
  readonly loggingOut: string;
  readonly logoutError: string;
  readonly ukrainian: string;
  readonly english: string;
}

export interface UserMenuProps {
  readonly locale: Locale;
  readonly user: SafeUser;
  readonly loginHref: string;
  readonly messages: UserMenuMessages;
}
