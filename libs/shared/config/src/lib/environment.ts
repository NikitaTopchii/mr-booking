import { z } from 'zod';

const nodeEnvironmentSchema = z.enum(['development', 'test', 'production']);

const portSchema = z.coerce.number().int().min(1).max(65_535);

const demoSeedWeekStartSchema = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/u)
    .refine(isValidMondayDate, {
      message: 'must be a valid Monday in YYYY-MM-DD format',
    })
    .optional(),
);

const environmentSchema = z
  .object({
    NODE_ENV: nodeEnvironmentSchema,
    APP_PORT: portSchema,
    WEB_INTERNAL_PORT: portSchema,
    API_INTERNAL_PORT: portSchema,
    DATABASE_PATH: z.string().trim().min(1),
    SEED_ON_START: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true'),
    OFFICE_TIME_ZONE: z.literal('Europe/Kyiv'),
    OFFICE_OPEN_TIME: z.literal('09:00'),
    OFFICE_CLOSE_TIME: z.literal('19:00'),
    WEB_ORIGIN: z.url(),
    API_INTERNAL_URL: z.url(),
    SESSION_COOKIE_NAME: z
      .string()
      .min(1)
      .regex(/^[A-Za-z0-9_-]+$/u),
    SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(365),
    DEMO_SEED_WEEK_START: demoSeedWeekStartSchema,
  })
  .superRefine((environment, context) => {
    if (
      environment.NODE_ENV === 'production' &&
      !isAbsolutePath(environment.DATABASE_PATH)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['DATABASE_PATH'],
        message: 'must be an absolute path in production',
      });
    }
  });

const localDefaults = {
  APP_PORT: '3000',
  WEB_INTERNAL_PORT: '3001',
  API_INTERNAL_PORT: '3002',
  DATABASE_PATH: '.data/mr-booking.sqlite',
  SEED_ON_START: 'true',
  OFFICE_TIME_ZONE: 'Europe/Kyiv',
  OFFICE_OPEN_TIME: '09:00',
  OFFICE_CLOSE_TIME: '19:00',
  WEB_ORIGIN: 'http://localhost:3000',
  API_INTERNAL_URL: 'http://localhost:3002',
  SESSION_COOKIE_NAME: 'room_booking_session',
  SESSION_TTL_DAYS: '7',
} as const;

export type RuntimeEnvironment = z.infer<typeof environmentSchema>;

export class EnvironmentValidationError extends Error {
  public constructor(issues: readonly z.core.$ZodIssue[]) {
    const details = issues
      .map((issue) => {
        const path = issue.path.join('.') || 'environment';
        return `${path}: ${issue.message}`;
      })
      .join('; ');

    super(`Invalid runtime environment: ${details}`);
    this.name = 'EnvironmentValidationError';
  }
}

export function parseRuntimeEnvironment(
  source: NodeJS.ProcessEnv,
): RuntimeEnvironment {
  const nodeEnvironment = nodeEnvironmentSchema.safeParse(
    source['NODE_ENV'] ?? 'development',
  );

  if (!nodeEnvironment.success) {
    throw new EnvironmentValidationError(nodeEnvironment.error.issues);
  }

  const candidate =
    nodeEnvironment.data === 'production'
      ? { ...source, NODE_ENV: nodeEnvironment.data }
      : { ...localDefaults, ...source, NODE_ENV: nodeEnvironment.data };

  const result = environmentSchema.safeParse(candidate);

  if (!result.success) {
    throw new EnvironmentValidationError(result.error.issues);
  }

  return result.data;
}

function isAbsolutePath(path: string): boolean {
  return path.startsWith('/') || /^[A-Za-z]:[\\/]/u.test(path);
}

function isValidMondayDate(value: string): boolean {
  const [yearValue, monthValue, dayValue] = value.split('-');
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  const candidate = new Date(Date.UTC(year, month - 1, day));

  return (
    candidate.getUTCFullYear() === year &&
    candidate.getUTCMonth() === month - 1 &&
    candidate.getUTCDate() === day &&
    candidate.getUTCDay() === 1
  );
}
