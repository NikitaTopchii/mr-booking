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
  const activeIndex = Math.max(
    items.findIndex((item) => isActivePath(pathname, item.href)),
    0,
  );

  return (
    <>
      <nav aria-label={label} className="hidden md:block">
        <ul className="flex items-center gap-1">
          {items.map((item) => {
            const active = isActivePath(pathname, item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                    active &&
                      'bg-accent font-semibold text-accent-foreground shadow-sm',
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
        className="pointer-events-none fixed inset-x-0 bottom-0 z-20 h-32 bg-gradient-to-t from-background via-background/95 to-transparent md:hidden"
      />

      <nav
        aria-label={label}
        data-mobile-navigation
        className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 mx-auto min-h-[var(--mobile-nav-height)] max-w-sm rounded-[2rem] border border-border/80 bg-card p-1.5 shadow-xl md:hidden"
      >
        <ul className="relative grid grid-cols-2 gap-2">
          <li
            aria-hidden="true"
            data-mobile-navigation-indicator
            className="pointer-events-none absolute inset-y-0 left-0 w-[calc((100%_-_0.5rem)/2)] rounded-[1.625rem] bg-accent shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
            style={{
              transform:
                activeIndex === 1
                  ? 'translate3d(calc(100% + 0.5rem), 0, 0)'
                  : 'translate3d(0, 0, 0)',
            }}
          />

          {items.map((item) => {
            const active = isActivePath(pathname, item.href);

            return (
              <li className="relative z-10" key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex min-h-14 touch-manipulation flex-col items-center justify-center gap-1 rounded-[1.625rem] px-3 py-2 text-center text-xs leading-4 font-medium text-muted-foreground outline-none transition-colors duration-300 hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card active:opacity-80',
                    active && 'font-semibold text-accent-foreground',
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
