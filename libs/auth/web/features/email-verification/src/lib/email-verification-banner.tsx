'use client';

import { Button, Card, CardContent } from '@mr-booking/shared-ui';
import { AlertCircle, CheckCircle2, MailCheck } from 'lucide-react';
import Link from 'next/link';
import { useCurrentUser } from './use-current-user';
import { useEmailVerificationResend } from './use-email-verification-resend';
import type {
  EmailVerificationBannerProps,
  EmailVerificationFeatureError,
} from './types/email-verification-feature.types';

function errorMessage(
  error: EmailVerificationFeatureError | undefined,
  messages: EmailVerificationBannerProps['messages'],
): string | undefined {
  if (!error) return undefined;
  if (error.code === 'rateLimited') return messages.resendRateLimited;
  if (error.code === 'deliveryFailed') return messages.deliveryFailure;
  if (error.code === 'unauthenticated') return messages.signInToResend;
  return messages.retry;
}

function withSeconds(message: string, seconds: number | undefined): string {
  return seconds === undefined
    ? message
    : message.replace('{seconds}', String(seconds));
}

export function EmailVerificationBanner({
  locale,
  messages,
  scheduleHref,
}: EmailVerificationBannerProps) {
  const { user } = useCurrentUser();
  const resend = useEmailVerificationResend(locale);

  if (!user || user.emailVerified) return null;

  const resendError = errorMessage(resend.error, messages);

  return (
    <aside
      aria-label={messages.title}
      className="mx-auto max-w-6xl px-4 pt-4 sm:px-6"
    >
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex gap-3">
            <MailCheck
              className="mt-0.5 size-5 shrink-0 text-primary"
              aria-hidden="true"
            />
            <div className="space-y-1">
              <p className="font-medium text-foreground">
                {messages.requiredBanner}
              </p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              {resend.sent ? (
                <p
                  className="flex items-center gap-1 text-sm text-muted-foreground"
                  role="status"
                >
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                  {messages.resendSent}
                </p>
              ) : null}
              {resendError ? (
                <p
                  className="flex items-center gap-1 text-sm text-destructive"
                  role="alert"
                >
                  <AlertCircle className="size-4" aria-hidden="true" />
                  {withSeconds(resendError, resend.retryAfterSeconds)}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Button asChild variant="outline" size="sm">
              <Link href={`/${locale}/verify-email`}>{messages.verify}</Link>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => void resend.resend()}
              disabled={resend.pending}
            >
              {resend.pending ? messages.resending : messages.resend}
            </Button>
            {resend.developmentVerificationUrl ? (
              <Button asChild variant="ghost" size="sm">
                <Link href={resend.developmentVerificationUrl}>
                  {messages.openVerificationLink}
                </Link>
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
      <Link className="sr-only" href={scheduleHref}>
        {messages.returnToSchedule}
      </Link>
    </aside>
  );
}
