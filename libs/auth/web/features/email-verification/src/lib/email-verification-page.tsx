'use client';

import { authKeys } from '@mr-booking/auth-data-access-web/client';
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Spinner,
} from '@mr-booking/shared-ui';
import { localizedRoute } from '@mr-booking/shared-i18n';
import { AlertCircle, CheckCircle2, MailCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSWRConfig } from 'swr';
import { useCurrentUser } from './use-current-user';
import { useEmailVerificationResend } from './use-email-verification-resend';
import { useEmailVerificationVerify } from './use-email-verification-verify';
import type {
  EmailVerificationFeatureError,
  EmailVerificationPageProps,
} from './types/email-verification-feature.types';

function verificationErrorMessage(
  error: EmailVerificationFeatureError | undefined,
  messages: EmailVerificationPageProps['messages'],
) {
  if (!error) return undefined;
  if (error.code === 'invalid') return messages.invalidOrExpired;
  if (error.code === 'deliveryFailed') return messages.deliveryFailure;
  if (error.code === 'unauthenticated') return messages.signInToResend;
  return messages.retry;
}

export function EmailVerificationPage({
  locale,
  messages,
  initialUser,
  scheduleHref,
  loginHref,
}: EmailVerificationPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const result = searchParams.get('result');
  const { user, refresh } = useCurrentUser(initialUser);
  const verify = useEmailVerificationVerify();
  const resend = useEmailVerificationResend(locale);
  const [completed, setCompleted] = useState(false);
  const { mutate } = useSWRConfig();

  useEffect(() => {
    if (verify.error || completed) {
      router.replace(
        `${localizedRoute(locale, '/verify-email')}?result=${verify.error ? 'invalid' : 'success'}`,
      );
    }
  }, [completed, locale, router, verify.error]);

  async function confirm() {
    if (!token || verify.pending) return;
    const response = await verify.verify(token);
    if (!response) return;
    setCompleted(true);
    if (user) {
      await mutate(
        authKeys.currentUser(),
        { user: { ...user, emailVerified: true } },
        false,
      );
    }
    await refresh();
    router.refresh();
  }

  const error = verificationErrorMessage(verify.error, messages);
  const resultError =
    result === 'invalid' ? messages.invalidOrExpired : undefined;
  const alreadyVerified = result === 'already-verified' || user?.emailVerified;
  const successful = completed || result === 'success';

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl items-start justify-center px-4 py-12 sm:items-center sm:py-20">
      <Card className="w-full">
        <CardHeader className="gap-3 text-center sm:p-8">
          <MailCheck
            className="mx-auto size-10 text-primary"
            aria-hidden="true"
          />
          <CardTitle>{messages.title}</CardTitle>
          <CardDescription>{messages.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 sm:px-8 sm:pb-8">
          {successful ? (
            <Alert>
              <CheckCircle2 aria-hidden="true" />
              <AlertDescription>{messages.success}</AlertDescription>
            </Alert>
          ) : alreadyVerified ? (
            <Alert>
              <CheckCircle2 aria-hidden="true" />
              <AlertDescription>{messages.alreadyVerified}</AlertDescription>
            </Alert>
          ) : error || resultError ? (
            <Alert variant="destructive" role="alert">
              <AlertCircle aria-hidden="true" />
              <AlertDescription>{error ?? resultError}</AlertDescription>
            </Alert>
          ) : token ? (
            <p className="text-center text-sm text-muted-foreground">
              {messages.ready}
            </p>
          ) : (
            <Alert>
              <MailCheck aria-hidden="true" />
              <AlertDescription>{messages.missingToken}</AlertDescription>
            </Alert>
          )}

          {token && !successful && !alreadyVerified ? (
            <Button
              type="button"
              className="w-full"
              onClick={() => void confirm()}
              disabled={verify.pending}
            >
              {verify.pending ? (
                <>
                  <Spinner className="size-4" />
                  {messages.verifying}
                </>
              ) : (
                messages.verify
              )}
            </Button>
          ) : null}

          {user && !user.emailVerified && !successful ? (
            <div className="space-y-3 border-t border-border pt-4">
              <p className="text-sm text-muted-foreground">{user.email}</p>
              {resend.sent ? (
                <p className="text-sm text-muted-foreground" role="status">
                  {messages.resendSent}
                </p>
              ) : null}
              {resend.error ? (
                <p className="text-sm text-destructive" role="alert">
                  {resend.error.code === 'rateLimited'
                    ? `${messages.resendRateLimited} ${messages.retryAfter.replace('{seconds}', String(resend.retryAfterSeconds ?? 0))}`
                    : messages.deliveryFailure}
                </p>
              ) : null}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => void resend.resend()}
                disabled={resend.pending}
              >
                {resend.pending ? messages.resending : messages.resend}
              </Button>
              {resend.developmentVerificationUrl ? (
                <Button asChild variant="ghost" className="w-full">
                  <Link href={resend.developmentVerificationUrl}>
                    {messages.openVerificationLink}
                  </Link>
                </Button>
              ) : null}
            </div>
          ) : !user ? (
            <p className="text-center text-sm text-muted-foreground">
              <Link className="underline underline-offset-4" href={loginHref}>
                {messages.signInToResend}
              </Link>
            </p>
          ) : null}

          <div className="flex justify-center">
            <Link
              className="text-sm font-medium underline underline-offset-4"
              href={scheduleHref}
            >
              {messages.returnToSchedule}
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
