import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { sessions } from '@mr-booking/auth-data-access';
import { DatabaseService } from '@mr-booking/shared-database';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import { AppModule } from '../app.module';

describe('authentication API', () => {
  let application: INestApplication;
  let directory: string;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    directory = mkdtempSync(join(tmpdir(), 'mr-booking-api-auth-'));
    process.env['NODE_ENV'] = 'test';
    process.env['DATABASE_PATH'] = join(directory, 'api.sqlite');
    process.env['SEED_ON_START'] = 'false';
    process.env['SESSION_COOKIE_NAME'] = 'room_booking_session';
    process.env['SESSION_TTL_DAYS'] = '7';

    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    application = module.createNestApplication();
    application.setGlobalPrefix('api');
    await application.init();
    databaseService = application.get(DatabaseService);
  });

  afterAll(async () => {
    await application.close();
    rmSync(directory, { force: true, recursive: true });
  });

  it('registers, sets an HttpOnly cookie, and returns only a safe user', async () => {
    const response = await request(application.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: 'Alice',
        email: ' Alice@Example.com ',
        password: 'password123',
      })
      .expect(201);

    expect(response.headers['set-cookie']?.[0]).toEqual(
      expect.stringContaining('room_booking_session='),
    );
    expect(response.headers['set-cookie']?.[0]).toEqual(
      expect.stringContaining('HttpOnly'),
    );
    expect(response.headers['set-cookie']?.[0]).toEqual(
      expect.stringContaining('SameSite=Lax'),
    );
    expect(response.body).toEqual({
      user: {
        id: expect.any(String),
        name: 'Alice',
        email: 'Alice@Example.com',
      },
    });
    expect(JSON.stringify(response.body)).not.toMatch(/password|token|hash/iu);
  });

  it('returns field-level registration validation errors', async () => {
    await request(application.getHttpServer())
      .post('/api/auth/register')
      .send({ name: ' ', email: 'bad', password: 'short' })
      .expect(400)
      .expect(({ body }) => {
        expect(body).toEqual({
          code: 'VALIDATION_ERROR',
          details: {
            fields: {
              name: 'NAME_REQUIRED',
              email: 'EMAIL_INVALID',
              password: 'PASSWORD_LENGTH',
            },
          },
        });
      });
  });

  it('returns a stable duplicate-email conflict', async () => {
    await request(application.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: 'Duplicate',
        email: ' ALICE@example.COM ',
        password: 'password123',
      })
      .expect(409)
      .expect(({ body }) => {
        expect(body.code).toBe('EMAIL_ALREADY_EXISTS');
        expect(body.details.fields.email).toBe('EMAIL_ALREADY_EXISTS');
      });
  });

  it.each(['wrong password', 'unknown email'])(
    'does not disclose whether credentials failed because of %s',
    async (scenario) => {
      const email =
        scenario === 'unknown email'
          ? 'missing@example.com'
          : 'alice@example.com';
      const password =
        scenario === 'wrong password' ? 'incorrect-password' : 'password123';

      await request(application.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password })
        .expect(401)
        .expect({
          code: 'INVALID_CREDENTIALS',
        });
    },
  );

  it('logs in, restores the session, logs out, and rejects that session', async () => {
    const agent = request.agent(application.getHttpServer());
    const login = await agent
      .post('/api/auth/login')
      .send({ email: 'alice@example.com', password: 'password123' })
      .expect(200);

    expect(login.headers['set-cookie']?.[0]).toContain('HttpOnly');
    await agent
      .get('/api/auth/me')
      .expect(200)
      .expect(({ body }) => {
        expect(body.user).toMatchObject({
          name: 'Alice',
          email: 'Alice@Example.com',
        });
        expect(JSON.stringify(body)).not.toMatch(/password|token|hash/iu);
      });

    const logout = await agent.post('/api/auth/logout').expect(204);
    expect(logout.headers['set-cookie']?.[0]).toContain(
      'room_booking_session=;',
    );
    await agent.get('/api/auth/me').expect(401).expect({
      code: 'UNAUTHENTICATED',
    });
  });

  it('rejects a missing cookie', async () => {
    await request(application.getHttpServer())
      .get('/api/auth/me')
      .expect(401)
      .expect(({ body }) => {
        expect(body.code).toBe('UNAUTHENTICATED');
      });
  });

  it('rejects an expired session', async () => {
    const agent = request.agent(application.getHttpServer());
    await agent
      .post('/api/auth/login')
      .send({ email: 'alice@example.com', password: 'password123' })
      .expect(200);
    const activeSession = databaseService.connection.drizzle
      .select()
      .from(sessions)
      .orderBy(sessions.createdAtUtc)
      .all()
      .at(-1);

    if (!activeSession) {
      throw new Error('Expected a login session');
    }

    databaseService.connection.drizzle
      .update(sessions)
      .set({ createdAtUtc: 0, expiresAtUtc: 1 })
      .where(eq(sessions.id, activeSession.id))
      .run();

    await agent
      .get('/api/auth/me')
      .expect(401)
      .expect(({ body }) => {
        expect(body.code).toBe('UNAUTHENTICATED');
      });
  });

  it('keeps logout idempotent when no session cookie exists', async () => {
    await request(application.getHttpServer())
      .post('/api/auth/logout')
      .expect(204);
  });

  it('never exposes raw exception messages', async () => {
    await request(application.getHttpServer())
      .post('/api/auth/register')
      .send({ name: null, email: null, password: null })
      .expect(400)
      .expect(({ body }) => {
        expect(body).toEqual({
          code: 'VALIDATION_ERROR',
          details: {
            fields: {
              name: 'NAME_REQUIRED',
              email: 'EMAIL_REQUIRED',
              password: 'PASSWORD_REQUIRED',
            },
          },
        });
        expect(JSON.stringify(body)).not.toMatch(/enter|exception|sqlite/iu);
      });
  });
});
