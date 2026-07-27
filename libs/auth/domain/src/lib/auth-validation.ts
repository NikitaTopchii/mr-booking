import { z } from 'zod';
import {
  AuthValidationError,
  type AuthField,
  type AuthFieldErrorCode,
} from './auth-errors';

const nameSchema = z
  .string({ error: 'NAME_REQUIRED' })
  .transform((value) => value.trim())
  .pipe(z.string().min(1, 'NAME_REQUIRED'));

const emailSchema = z
  .string({ error: 'EMAIL_REQUIRED' })
  .transform((value) => cleanEmail(value))
  .pipe(z.string().min(1, 'EMAIL_REQUIRED').pipe(z.email('EMAIL_INVALID')));

const passwordSchema = z
  .string({ error: 'PASSWORD_REQUIRED' })
  .superRefine((value, context) => {
    const length = Array.from(value).length;

    if (length === 0) {
      context.addIssue({
        code: 'custom',
        message: 'PASSWORD_REQUIRED',
      });
    } else if (length < 8 || length > 72) {
      context.addIssue({
        code: 'custom',
        message: 'PASSWORD_LENGTH',
      });
    }
  });

export const registrationInputSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const loginInputSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export type RegistrationInput = z.input<typeof registrationInputSchema>;
export type ValidatedRegistrationInput = z.output<
  typeof registrationInputSchema
>;
export type LoginInput = z.input<typeof loginInputSchema>;
export type ValidatedLoginInput = z.output<typeof loginInputSchema>;

export function cleanEmail(email: string): string {
  return email.trim();
}

export function normalizeEmail(email: string): string {
  return cleanEmail(email).toLowerCase();
}

export function parseRegistrationInput(
  input: unknown,
): ValidatedRegistrationInput {
  return parseAuthInput(registrationInputSchema, input);
}

export function parseLoginInput(input: unknown): ValidatedLoginInput {
  return parseAuthInput(loginInputSchema, input);
}

function parseAuthInput<TSchema extends z.ZodType>(
  schema: TSchema,
  input: unknown,
): z.output<TSchema> {
  const result = schema.safeParse(input);

  if (result.success) {
    return result.data;
  }

  const fields: Partial<Record<AuthField, AuthFieldErrorCode>> = {};

  for (const issue of result.error.issues) {
    const field = issue.path[0];

    if (
      (field === 'name' || field === 'email' || field === 'password') &&
      !fields[field]
    ) {
      fields[field] = issue.message as AuthFieldErrorCode;
    }
  }

  throw new AuthValidationError(fields);
}
