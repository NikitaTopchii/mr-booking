import type { AuthMode } from '@mr-booking/auth-ui';
import type { Locale } from '@mr-booking/shared-i18n';

export interface AuthPageProps {
  readonly locale: Locale;
  readonly mode: AuthMode;
}
