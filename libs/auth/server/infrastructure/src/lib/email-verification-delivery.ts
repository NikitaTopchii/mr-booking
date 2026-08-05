import { Injectable, Logger, type LoggerService } from '@nestjs/common';
import type {
  EmailVerificationDelivery,
  EmailVerificationEmail,
} from '@mr-booking/auth-domain';
import type { EmailVerificationTemplate } from './types/email-verification-template.types';

@Injectable()
export class DevelopmentEmailVerificationDelivery implements EmailVerificationDelivery {
  public constructor(
    private readonly logger: LoggerService = new Logger(
      DevelopmentEmailVerificationDelivery.name,
    ),
    private readonly logDevelopmentVerificationLink = false,
  ) {}

  public async sendVerificationEmail(
    input: EmailVerificationEmail,
  ): Promise<void> {
    renderEmailVerificationTemplate(input);
    if (this.logDevelopmentVerificationLink) {
      this.logger.log(
        `[email-verification:development] Verification link for user ${input.userId}: ${input.verificationUrl}`,
      );
    }
  }
}

@Injectable()
export class DisabledEmailVerificationDelivery implements EmailVerificationDelivery {
  public async sendVerificationEmail(): Promise<void> {
    throw new Error('EMAIL_DELIVERY_DISABLED');
  }
}

export function renderEmailVerificationTemplate(
  input: EmailVerificationEmail,
): EmailVerificationTemplate {
  const localized = input.locale === 'uk' ? ukrainianTemplate : englishTemplate;
  const safeName = escapeHtml(input.name);
  const expiresAt = new Date(input.expiresAtUtc).toISOString();

  return {
    subject: localized.subject,
    text: localized.text(safeName, input.verificationUrl, expiresAt),
    html: localized.html(safeName, input.verificationUrl, expiresAt),
  };
}

const englishTemplate = {
  subject: 'Verify your MR Booking email',
  text: (name: string, url: string, expiresAt: string) =>
    `Hello ${name},\n\nVerify your MR Booking email:\n${url}\n\nThis link expires at ${expiresAt} UTC. If you did not create this account, you can ignore this message.`,
  html: (name: string, url: string, expiresAt: string) =>
    `<p>Hello ${name},</p><p><a href="${escapeHtml(url)}">Verify your MR Booking email</a></p><p>This link expires at ${expiresAt} UTC.</p><p>If you did not create this account, you can ignore this message.</p>`,
};

const ukrainianTemplate = {
  subject: 'Підтвердіть електронну пошту MR Booking',
  text: (name: string, url: string, expiresAt: string) =>
    `Вітаємо, ${name}!\n\nПідтвердіть електронну пошту MR Booking:\n${url}\n\nПосилання дійсне до ${expiresAt} UTC. Якщо ви не створювали цей акаунт, проігноруйте це повідомлення.`,
  html: (name: string, url: string, expiresAt: string) =>
    `<p>Вітаємо, ${name}!</p><p><a href="${escapeHtml(url)}">Підтвердити електронну пошту MR Booking</a></p><p>Посилання дійсне до ${expiresAt} UTC.</p><p>Якщо ви не створювали цей акаунт, проігноруйте це повідомлення.</p>`,
};

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>'"]/gu,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;',
      })[character] ?? character,
  );
}
