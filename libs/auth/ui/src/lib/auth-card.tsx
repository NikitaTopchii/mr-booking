import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@mr-booking/shared-ui';
import type { ReactNode } from 'react';

export interface AuthCardProps {
  readonly title: string;
  readonly description: string;
  readonly languageSwitcher: ReactNode;
  readonly children: ReactNode;
}

export function AuthCard({
  title,
  description,
  languageSwitcher,
  children,
}: AuthCardProps) {
  return (
    <Card
      aria-labelledby="auth-page-title"
      className="w-full max-w-md overflow-hidden rounded-b-none rounded-t-3xl border-x-0 border-b-0 shadow-lg md:rounded-none md:border-0 md:bg-transparent md:shadow-none"
    >
      <CardHeader className="gap-2 p-6 pb-5 md:p-0 md:pb-8">
        <CardTitle id="auth-page-title">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-6 pt-1 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:p-0">
        {children}
        <div className="mt-2 flex justify-center">{languageSwitcher}</div>
      </CardContent>
    </Card>
  );
}
