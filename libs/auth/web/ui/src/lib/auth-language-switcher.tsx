'use client';

import { Button } from '@mr-booking/shared-ui';
import Link from 'next/link';
import type { AuthLanguageSwitcherProps } from './types/auth-ui.types';

export function AuthLanguageSwitcher({
  label,
  currentLocale,
  ukrainianLabel,
  englishLabel,
  ukrainianHref,
  englishHref,
}: AuthLanguageSwitcherProps) {
  return (
    <nav
      aria-label={label}
      className="flex items-center text-xs text-muted-foreground"
    >
      <Button
        asChild
        variant="ghost"
        className={
          currentLocale === 'uk'
            ? 'min-w-11 px-2 text-xs font-semibold text-foreground'
            : 'min-w-11 px-2 text-xs font-medium text-muted-foreground'
        }
      >
        <Link
          href={ukrainianHref}
          hrefLang="uk"
          aria-label={ukrainianLabel}
          aria-current={currentLocale === 'uk' ? 'page' : undefined}
          onClick={(event) => {
            event.preventDefault();
            window.location.assign(ukrainianHref);
          }}
        >
          uk
        </Link>
      </Button>
      <span aria-hidden="true">/</span>
      <Button
        asChild
        variant="ghost"
        className={
          currentLocale === 'en'
            ? 'min-w-11 px-2 text-xs font-semibold text-foreground'
            : 'min-w-11 px-2 text-xs font-medium text-muted-foreground'
        }
      >
        <Link
          href={englishHref}
          hrefLang="en"
          aria-label={englishLabel}
          aria-current={currentLocale === 'en' ? 'page' : undefined}
          onClick={(event) => {
            event.preventDefault();
            window.location.assign(englishHref);
          }}
        >
          en
        </Link>
      </Button>
    </nav>
  );
}
