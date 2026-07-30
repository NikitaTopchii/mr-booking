import type { ReactNode } from 'react';

export interface LocaleRouteParams {
  readonly locale: string;
}

export interface LocalePageProps {
  readonly params: Promise<LocaleRouteParams>;
}

export interface LocaleLayoutProps extends LocalePageProps {
  readonly children: ReactNode;
}
