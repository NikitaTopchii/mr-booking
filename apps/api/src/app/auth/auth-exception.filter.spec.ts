import { type ArgumentsHost, HttpStatus, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { AuthExceptionFilter } from './auth-exception.filter';

describe('AuthExceptionFilter', () => {
  it('maps unexpected exceptions without returning internal prose', () => {
    const response = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
    const host = {
      switchToHttp: () => ({
        getResponse: () => response,
      }),
    } as unknown as ArgumentsHost;
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    new AuthExceptionFilter().catch(
      new Error('raw SQLite password token detail'),
      host,
    );

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.SERVICE_UNAVAILABLE,
    );
    expect(response.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'private, no-store',
    );
    expect(response.json).toHaveBeenCalledWith({
      code: 'SERVICE_UNAVAILABLE',
    });
    expect(JSON.stringify(jest.mocked(response.json).mock.calls)).not.toMatch(
      /sqlite|password|token/iu,
    );
  });
});
