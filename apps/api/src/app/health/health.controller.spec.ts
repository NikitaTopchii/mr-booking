import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TerminusModule } from '@nestjs/terminus';
import {
  DatabaseService,
  SqliteHealthIndicator,
} from '@mr-booking/shared-database';
import request from 'supertest';
import { HealthController } from './health.controller';

describe('health endpoints', () => {
  let application: INestApplication;
  const databaseService = {
    assertReady: jest.fn(),
  };

  beforeEach(async () => {
    databaseService.assertReady.mockReset();

    const module = await Test.createTestingModule({
      imports: [TerminusModule],
      controllers: [HealthController],
      providers: [
        SqliteHealthIndicator,
        { provide: DatabaseService, useValue: databaseService },
      ],
    }).compile();

    application = module.createNestApplication();
    application.setGlobalPrefix('api');
    await application.init();
  });

  afterEach(async () => {
    await application.close();
  });

  it('reports process liveness', async () => {
    await request(application.getHttpServer())
      .get('/api/health/live')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('reports readiness when SQLite is available', async () => {
    await request(application.getHttpServer())
      .get('/api/health/ready')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          status: 'ok',
          info: { database: { status: 'up' } },
        });
      });
  });

  it('reports readiness failure when database initialization failed', async () => {
    databaseService.assertReady.mockImplementation(() => {
      throw new Error('initialization failed');
    });

    await request(application.getHttpServer())
      .get('/api/health/ready')
      .expect(503)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          status: 'error',
          error: {
            database: {
              status: 'down',
              message: 'SQLite is not ready',
            },
          },
        });
      });
  });
});
