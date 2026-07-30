import { defaultLocale, hasLocale, type Locale } from '@mr-booking/shared-i18n';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const localeCookieName = 'mr_booking_locale';
const localeLikeSegment = /^[a-z]{2}$/u;

export function proxy(request: NextRequest): NextResponse {
  const pathname = request.nextUrl.pathname;

  if (isInfrastructurePath(pathname)) {
    return NextResponse.next();
  }

  const firstSegment = pathname.split('/').filter(Boolean)[0];

  if (firstSegment && hasLocale(firstSegment)) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-mr-booking-locale', firstSegment);
    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    response.cookies.set(localeCookieName, firstSegment, {
      sameSite: 'lax',
      path: '/',
    });
    return response;
  }

  if (firstSegment && localeLikeSegment.test(firstSegment)) {
    return NextResponse.next();
  }

  const locale = resolvePreferredLocale(request);
  const destination = request.nextUrl.clone();
  destination.pathname =
    pathname === '/' ? `/${locale}` : `/${locale}${pathname}`;
  return NextResponse.redirect(destination);
}

function resolvePreferredLocale(request: NextRequest): Locale {
  const savedLocale = request.cookies.get(localeCookieName)?.value;
  return savedLocale && hasLocale(savedLocale) ? savedLocale : defaultLocale;
}

function isInfrastructurePath(pathname: string): boolean {
  return (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname === '/health' ||
    pathname === '/favicon.ico' ||
    /\.[a-z0-9]+$/iu.test(pathname)
  );
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
