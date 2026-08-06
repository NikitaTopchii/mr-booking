'use client';

import { cn } from '@mr-booking/shared-ui';
import { CalendarDays, ListChecks } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ApplicationNavigationProps } from './types/application-shell.types';

export function ApplicationNavigation({
  label,
  schedule,
  myBookings,
}: ApplicationNavigationProps) {
  const pathname = usePathname();
  const items = [
    { ...schedule, icon: CalendarDays },
    { ...myBookings, icon: ListChecks },
  ] as const;
  return (
    <>
      <nav aria-label={label} className="hidden md:block">
        <ul className="flex items-stretch">
          {items.map((item) => {
            const active = isActivePath(pathname, item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'inline-flex min-h-16 items-center gap-2 border-b-2 border-transparent px-4 text-sm font-medium text-muted-foreground transition-colors duration-150 outline-none hover:bg-accent/55 hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                    active && 'border-primary font-semibold text-foreground',
                  )}
                >
                  <item.icon aria-hidden="true" className="size-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div
        aria-hidden="true"
        data-mobile-navigation-scrim
        className="pointer-events-none fixed inset-x-0 bottom-0 z-20 h-[calc(var(--mobile-navigation-height)+var(--mobile-navigation-bottom-offset))] bg-background md:hidden"
      />

      <nav
        aria-label={label}
        data-mobile-navigation
        className="fixed inset-x-0 bottom-0 z-30 min-h-[var(--mobile-navigation-height)] border-b border-border bg-card px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 md:hidden"
      >
        <ul className="mx-auto grid max-w-sm grid-cols-2">
          {items.map((item) => {
            const active = isActivePath(pathname, item.href);

            return (
              <li className="relative z-10" key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex min-h-14 touch-manipulation flex-col items-center justify-center gap-1 border-b-2 border-transparent px-3 py-2 text-center text-xs leading-4 font-medium text-muted-foreground outline-none transition-colors duration-150 hover:bg-accent/55 hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring active:translate-y-px',
                    active &&
                      'border-primary bg-accent font-semibold text-accent-foreground',
                  )}
                >
                  <item.icon aria-hidden="true" className="size-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
