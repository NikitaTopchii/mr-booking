import { NextRequest } from 'next/server';
import { proxy } from './proxy';

describe('locale proxy', () => {
  it.each([
    ['/', '/uk'],
    ['/login', '/uk/login'],
    ['/register', '/uk/register'],
    ['/schedule', '/uk/schedule'],
  ])('redirects %s to the default locale', (pathname, destination) => {
    const response = proxy(new NextRequest(`http://localhost:3001${pathname}`));

    expect(response.status).toBe(307);
    expect(new URL(response.headers.get('location') ?? '').pathname).toBe(
      destination,
    );
  });

  it('preserves supported and unsupported locale segments for App Router', () => {
    expect(
      proxy(new NextRequest('http://localhost:3001/en/login')).status,
    ).toBe(200);
    expect(
      proxy(new NextRequest('http://localhost:3001/fr/login')).status,
    ).toBe(200);
  });

  it('ignores API, Next.js assets, and static files', () => {
    expect(
      proxy(new NextRequest('http://localhost:3001/api/auth/me')).status,
    ).toBe(200);
    expect(
      proxy(new NextRequest('http://localhost:3001/_next/static/app.js'))
        .status,
    ).toBe(200);
    expect(
      proxy(new NextRequest('http://localhost:3001/robots.txt')).status,
    ).toBe(200);
  });
});
