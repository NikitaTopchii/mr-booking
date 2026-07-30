import type { AuthField as AuthFieldName } from '@mr-booking/auth-domain';
import type {
  FormEventHandler,
  HTMLInputTypeAttribute,
  ReactNode,
  RefObject,
} from 'react';

export type AuthMode = 'login' | 'register';

export interface AuthCardProps {
  readonly title: string;
  readonly description: string;
  readonly languageSwitcher: ReactNode;
  readonly children: ReactNode;
}

export interface AuthFieldProps {
  readonly name: AuthFieldName;
  readonly label: string;
  readonly type?: HTMLInputTypeAttribute;
  readonly autoComplete: string;
  readonly hint?: string | undefined;
  readonly error?: string | undefined;
  readonly disabled?: boolean;
}

export interface AuthFormErrorProps {
  readonly message: string;
}

export interface AuthFormMessages {
  readonly nameLabel?: string;
  readonly emailLabel: string;
  readonly passwordLabel: string;
  readonly passwordHint?: string;
  readonly submit: string;
  readonly submitting: string;
  readonly switchText: string;
  readonly switchAction: string;
}

export interface AuthFormViewProps {
  readonly mode: AuthMode;
  readonly messages: AuthFormMessages;
  readonly switchHref: string;
  readonly formRef: RefObject<HTMLFormElement | null>;
  readonly onSubmit: FormEventHandler<HTMLFormElement>;
  readonly submitting: boolean;
  readonly fieldErrors: Readonly<Partial<Record<AuthFieldName, string>>>;
  readonly formError?: string | undefined;
}

export interface AuthLanguageSwitcherProps {
  readonly label: string;
  readonly currentLocale: 'uk' | 'en';
  readonly ukrainianLabel: string;
  readonly englishLabel: string;
  readonly ukrainianHref: string;
  readonly englishHref: string;
}

export interface LogoutControlProps {
  readonly label: string;
  readonly submittingLabel: string;
  readonly submitting: boolean;
  readonly error?: string | undefined;
  readonly onLogout: () => void;
}
