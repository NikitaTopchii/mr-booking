import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { sessions, users } from '@mr-booking/auth-data-access';
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
    expect(response.headers['set-cookie']?.[0]).toEqual(
      expect.stringContaining('Max-Age=604800'),
    );
    expect(response.headers['set-cookie']?.[0]).toEqual(
      expect.stringContaining('Expires='),
    );
    expect(response.headers['set-cookie']?.[0]).toEqual(
      expect.stringContaining('Path=/'),
    );
    expect(response.headers['cache-control']).toBe('private, no-store');
    expect(response.body).toEqual({
      user: {
        id: expect.any(String),
        name: 'Alice',
        email: 'Alice@Example.com',
        emailVerified: false,
      },
      emailVerification: expect.objectContaining({
        status: 'sent',
        code: 'EMAIL_VERIFICATION_SENT',
        developmentVerificationUrl: expect.stringContaining(
          '/uk/verify-email?token=',
        ),
      }),
    });
    expect(JSON.stringify(response.body)).not.toMatch(/password|hash/iu);

    const persistedUser = databaseService.connection.drizzle
      .select()
      .from(users)
      .where(eq(users.normalizedEmail, 'alice@example.com'))
      .get();
    const persistedSession = persistedUser
      ? databaseService.connection.drizzle
          .select()
          .from(sessions)
          .where(eq(sessions.userId, persistedUser.id))
          .get()
      : undefined;
    const rawSessionToken = response.headers['set-cookie']?.[0]?.match(
      /room_booking_session=([^;]+)/u,
    )?.[1];

    expect(persistedUser?.passwordHash.startsWith('$argon2id$')).toBe(true);
    expect(persistedUser?.passwordHash).not.toContain('password123');
    expect(rawSessionToken).toBeDefined();
    expect(persistedSession?.tokenHash).toHaveLength(64);
    expect(persistedSession?.tokenHash).not.toBe(rawSessionToken);
  });

  it('automatically authenticates a newly registered user', async () => {
    const agent = request.agent(application.getHttpServer());

    await agent
      .post('/api/auth/register')
      .send({
        name: 'Марія',
        email: 'maria@example.com',
        password: ' pass123 ',
      })
      .expect(201);
    await agent
      .get('/api/auth/me')
      .expect(200)
      .expect(({ body, headers }) => {
        expect(headers['cache-control']).toBe('private, no-store');
        expect(body.user).toMatchObject({
          name: 'Марія',
          email: 'maria@example.com',
        });
      });
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

  it('returns one stable winner for concurrent normalized-email registration', async () => {
    const attempts = await Promise.all([
      request(application.getHttpServer()).post('/api/auth/register').send({
        name: 'Race One',
        email: ' Race@Example.com ',
        password: 'password123',
      }),
      request(application.getHttpServer()).post('/api/auth/register').send({
        name: 'Race Two',
        email: 'race@example.COM',
        password: 'password123',
      }),
    ]);

    expect(attempts.map(({ status }) => status).sort()).toEqual([201, 409]);
    expect(attempts.find(({ status }) => status === 409)?.body).toMatchObject({
      code: 'EMAIL_ALREADY_EXISTS',
      details: {
        fields: { email: 'EMAIL_ALREADY_EXISTS' },
      },
    });
    expect(
      databaseService.connection.drizzle
        .select()
        .from(users)
        .where(eq(users.normalizedEmail, 'race@example.com'))
        .all(),
    ).toHaveLength(1);
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
    expect(logout.headers['set-cookie']?.[0]).toContain('Path=/');
    expect(logout.headers['set-cookie']?.[0]).toContain('HttpOnly');
    expect(logout.headers['set-cookie']?.[0]).toContain('SameSite=Lax');
    expect(logout.headers['cache-control']).toBe('private, no-store');
    await agent.get('/api/auth/me').expect(401).expect({
      code: 'UNAUTHENTICATED',
    });
  });

  it('rejects a missing cookie', async () => {
    await request(application.getHttpServer())
      .get('/api/auth/me')
      .expect(401)
      .expect(({ body, headers }) => {
        expect(body.code).toBe('UNAUTHENTICATED');
        expect(headers['cache-control']).toBe('private, no-store');
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

  it('issues, rate-limits, consumes, and rejects replay of a verification token', async () => {
    const agent = request.agent(application.getHttpServer());
    const registration = await agent
      .post('/api/auth/register')
      .send({
        name: 'Verification User',
        email: 'verification@example.com',
        password: 'password123',
        locale: 'en',
      })
      .expect(201);
    const verificationUrl = registration.body.emailVerification
      .developmentVerificationUrl as string;
    const token = new URL(verificationUrl).searchParams.get('token');

    expect(token).toBeTruthy();
    await agent
      .post('/api/auth/email-verification/request')
      .send({ locale: 'en' })
      .expect(429)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          code: 'EMAIL_VERIFICATION_RATE_LIMITED',
          details: { retryAfterSeconds: 60 },
        });
      });
    await agent
      .post('/api/auth/email-verification/verify')
      .send({ token })
      .expect(200, { code: 'EMAIL_VERIFIED' });
    await agent
      .get('/api/auth/me')
      .expect(200)
      .expect(({ body }) => expect(body.user.emailVerified).toBe(true));
    await request(application.getHttpServer())
      .post('/api/auth/email-verification/verify')
      .send({ token })
      .expect(400, { code: 'EMAIL_VERIFICATION_INVALID_OR_EXPIRED' });
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
