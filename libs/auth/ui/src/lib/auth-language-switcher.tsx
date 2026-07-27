import { Button } from '@mr-booking/shared-ui';

export interface AuthLanguageSwitcherProps {
  readonly label: string;
  readonly currentLocale: 'uk' | 'en';
  readonly ukrainianLabel: string;
  readonly englishLabel: string;
  readonly ukrainianHref: string;
  readonly englishHref: string;
}

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
        <a
          href={ukrainianHref}
          hrefLang="uk"
          aria-label={ukrainianLabel}
          aria-current={currentLocale === 'uk' ? 'page' : undefined}
        >
          uk
        </a>
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
        <a
          href={englishHref}
          hrefLang="en"
          aria-label={englishLabel}
          aria-current={currentLocale === 'en' ? 'page' : undefined}
        >
          en
        </a>
      </Button>
    </nav>
  );
}
