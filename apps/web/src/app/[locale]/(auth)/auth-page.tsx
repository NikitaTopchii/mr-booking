import { AuthForm } from '@mr-booking/auth-feature-web';
import {
  AuthCard,
  AuthLanguageSwitcher,
  type AuthFormMessages,
} from '@mr-booking/auth-ui';
import { localizedRoute, type AppDictionary } from '@mr-booking/shared-i18n';
import { getDictionary } from '@mr-booking/shared-i18n/server';
import type { AuthPageProps } from './types/auth-page.types';

export async function AuthPage({ locale, mode }: AuthPageProps) {
  const dictionary = await getDictionary(locale);
  const isRegistration = mode === 'register';
  const pageMessages = isRegistration
    ? dictionary.auth.register
    : dictionary.auth.login;
  const formMessages: AuthFormMessages = {
    ...(isRegistration
      ? {
          nameLabel: dictionary.auth.register.nameLabel,
          passwordHint: dictionary.auth.register.passwordHint,
        }
      : {}),
    emailLabel: pageMessages.emailLabel,
    passwordLabel: pageMessages.passwordLabel,
    submit: pageMessages.submit,
    submitting: pageMessages.submitting,
    switchText: pageMessages.switchText,
    switchAction: pageMessages.switchAction,
  };
  const currentRoute = isRegistration ? '/register' : '/login';

  return (
    <AuthCard
      title={pageMessages.title}
      description={pageMessages.description}
      languageSwitcher={
        <AuthLanguageSwitcher
          label={dictionary.auth.language.label}
          currentLocale={locale}
          ukrainianLabel={dictionary.auth.language.ukrainian}
          englishLabel={dictionary.auth.language.english}
          ukrainianHref={localizedRoute('uk', currentRoute)}
          englishHref={localizedRoute('en', currentRoute)}
        />
      }
    >
      <AuthForm
        mode={mode}
        messages={formMessages}
        errorMessages={selectErrorMessages(dictionary)}
        loginHref={localizedRoute(locale, '/login')}
        registerHref={localizedRoute(locale, '/register')}
        successHref={localizedRoute(locale, '/schedule')}
      />
    </AuthCard>
  );
}

function selectErrorMessages(dictionary: AppDictionary) {
  return {
    invalidCredentials: dictionary.auth.errors.invalidCredentials,
    network: dictionary.auth.errors.network,
    serviceUnavailable: dictionary.auth.errors.serviceUnavailable,
    fields: dictionary.auth.errors.fields,
  };
}
