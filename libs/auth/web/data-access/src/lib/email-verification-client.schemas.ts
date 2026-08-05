import { z } from 'zod';

export const emailVerificationDeliverySchema = z
  .object({
    status: z.enum(['sent', 'delivery-failed', 'already-verified']),
    code: z.enum([
      'EMAIL_VERIFICATION_SENT',
      'EMAIL_VERIFICATION_DELIVERY_FAILED',
      'EMAIL_ALREADY_VERIFIED',
    ]),
    expiresAtUtc: z.iso.datetime({ offset: true }).optional(),
    retryAfterSeconds: z.number().int().positive().optional(),
    developmentVerificationUrl: z.string().url().optional(),
  })
  .strict();

export const emailVerificationRequestResponseSchema = z
  .object({
    status: z.enum(['sent', 'already-verified']),
    code: z.enum(['EMAIL_VERIFICATION_SENT', 'EMAIL_ALREADY_VERIFIED']),
    expiresAtUtc: z.iso.datetime({ offset: true }).optional(),
    retryAfterSeconds: z.number().int().positive().optional(),
    developmentVerificationUrl: z.string().url().optional(),
  })
  .strict();

export const emailVerificationVerifyResponseSchema = z
  .object({
    code: z.enum(['EMAIL_VERIFIED', 'EMAIL_ALREADY_VERIFIED']),
  })
  .strict();

export const emailVerificationApiErrorSchema = z
  .object({
    code: z.string().min(1),
    details: z
      .object({ retryAfterSeconds: z.number().int().positive() })
      .optional(),
  })
  .passthrough();
