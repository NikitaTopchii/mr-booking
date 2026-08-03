import { z } from 'zod';

export const emailVerificationLocaleSchema = z.enum(['uk', 'en']);

export const requestEmailVerificationBodySchema = z
  .object({
    locale: emailVerificationLocaleSchema.optional(),
  })
  .strict();

export const verifyEmailBodySchema = z
  .object({
    token: z.string().regex(/^[A-Za-z0-9_-]{43,128}$/u, 'TOKEN_INVALID'),
  })
  .strict();

export type EmailVerificationLocale = z.infer<
  typeof emailVerificationLocaleSchema
>;
