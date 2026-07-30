'use client';

import { useLogout } from '@mr-booking/auth-feature-web';
import type { Locale } from '@mr-booking/shared-i18n';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@mr-booking/shared-ui';
import { Check, ChevronDown, Languages, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import type { UserMenuProps } from './types/application-shell.types';

export function UserMenu({ locale, user, loginHref, messages }: UserMenuProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { submitting, failed, logout } = useLogout(loginHref);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="max-w-56 gap-2 px-2"
          aria-label={`${messages.open}: ${user.name}`}
        >
          <span
            aria-hidden="true"
            className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
          >
            {initials(user.name, locale)}
          </span>
          <span className="hidden min-w-0 text-left sm:block">
            <span className="block truncate text-sm font-medium">
              {user.name}
            </span>
          </span>
          <ChevronDown aria-hidden="true" className="size-4 shrink-0" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="space-y-1">
          <span className="block">{messages.signedInAs}</span>
          <strong className="block truncate text-sm font-semibold text-foreground">
            {user.name}
          </strong>
          <span className="block truncate font-normal text-muted-foreground">
            {user.email}
          </span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="flex items-center gap-2">
          <Languages aria-hidden="true" className="size-4" />
          {messages.language}
        </DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link
            href={replaceLocale(pathname, searchParams.toString(), 'uk')}
            hrefLang="uk"
            aria-current={locale === 'uk' ? 'page' : undefined}
          >
            <span className="w-5" aria-hidden="true">
              {locale === 'uk' ? <Check className="size-4" /> : null}
            </span>
            {messages.ukrainian}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href={replaceLocale(pathname, searchParams.toString(), 'en')}
            hrefLang="en"
            aria-current={locale === 'en' ? 'page' : undefined}
          >
            <span className="w-5" aria-hidden="true">
              {locale === 'en' ? <Check className="size-4" /> : null}
            </span>
            {messages.english}
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          disabled={submitting}
          className="text-destructive focus:text-destructive"
          onSelect={(event) => {
            event.preventDefault();
            void logout();
          }}
        >
          <LogOut aria-hidden="true" className="size-4" />
          {submitting ? messages.loggingOut : messages.logout}
        </DropdownMenuItem>
        {failed ? (
          <p
            className="px-3 py-2 text-xs font-medium leading-5 text-destructive"
            role="status"
          >
            {messages.logoutError}
          </p>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function replaceLocale(
  pathname: string,
  search: string,
  locale: Locale,
): string {
  const segments = pathname.split('/');
  segments[1] = locale;
  return `${segments.join('/')}${search ? `?${search}` : ''}`;
}

function initials(name: string, locale: Locale): string {
  return name
    .trim()
    .split(/\s+/u)
    .slice(0, 2)
    .map((part) => Array.from(part)[0]?.toLocaleUpperCase(locale) ?? '')
    .join('');
}
