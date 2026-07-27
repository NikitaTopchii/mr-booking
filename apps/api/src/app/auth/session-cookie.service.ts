import { Injectable } from '@nestjs/common';
import { parseRuntimeEnvironment } from '@mr-booking/shared-config';
import type { Request, Response } from 'express';

@Injectable()
export class SessionCookieService {
  private readonly environment = parseRuntimeEnvironment(process.env);

  public read(request: Request): string | undefined {
    const cookieHeader = request.headers.cookie;

    if (!cookieHeader) {
      return undefined;
    }

    return readCookie(cookieHeader, this.environment.SESSION_COOKIE_NAME);
  }

  public set(
    response: Response,
    rawSessionToken: string,
    expiresAtUtc: number,
  ): void {
    response.cookie(
      this.environment.SESSION_COOKIE_NAME,
      rawSessionToken,
      this.options(expiresAtUtc),
    );
  }

  public clear(response: Response): void {
    response.clearCookie(this.environment.SESSION_COOKIE_NAME, {
      httpOnly: true,
      secure: this.environment.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }

  private options(expiresAtUtc: number) {
    const maxAge = this.environment.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

    return {
      httpOnly: true,
      secure: this.environment.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      expires: new Date(expiresAtUtc),
      maxAge,
    };
  }
}

function readCookie(header: string, expectedName: string): string | undefined {
  for (const pair of header.split(';')) {
    const separator = pair.indexOf('=');

    if (separator < 0 || pair.slice(0, separator).trim() !== expectedName) {
      continue;
    }

    const value = pair.slice(separator + 1).trim();

    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  return undefined;
}
