import { expect, request, test, type Page } from '@playwright/test';

test.describe('authentication journey', () => {
  test('registration authenticates, survives reload, and logout revokes the session', async ({
    page,
  }) => {
    const email = `e2e-${Date.now()}@example.com`;
    await page.goto('/register');
    await page.getByLabel('Ім’я').fill('E2E User');
    await page.getByLabel('Електронна пошта').fill(email);
    await page.getByLabel('Пароль').fill('password123');
    await page.getByRole('button', { name: 'Створити акаунт' }).click();

    await expect(page).toHaveURL(/\/uk\/verify-email\?token=/u);
    await page.getByRole('button', { name: 'Підтвердити пошту' }).click();
    await expect(page).toHaveURL(/\/uk\/verify-email\?result=success$/u);
    await page.getByRole('link', { name: 'Повернутися до розкладу' }).click();
    await expect(page).toHaveURL(/\/uk\/schedule(?:\?.*)?$/u);
    const userMenu = page.getByRole('button', {
      name: 'Відкрити меню користувача: E2E User',
    });
    await userMenu.click();
    await expect(page.getByText(email)).toBeVisible();
    await page.keyboard.press('Escape');
    await page.reload();
    await expect(page).toHaveURL(/\/uk\/schedule(?:\?.*)?$/u);
    await userMenu.click();
    await expect(page.getByText(email)).toBeVisible();

    await page.getByRole('menuitem', { name: 'Вийти' }).click();
    await expect(page).toHaveURL(/\/uk\/login$/u);
    expect((await page.request.get('/api/auth/me')).status()).toBe(401);
    await page.goBack();
    await expect(page).not.toHaveURL(/\/uk\/schedule(?:\?.*)?$/u);
    await expect(page.getByText(email)).toHaveCount(0);
    await page.goto('/schedule');
    await expect(page).toHaveURL(/\/uk\/login$/u);
  });

  test('login works and authenticated users cannot return to auth pages', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.getByLabel('Електронна пошта').fill('alice@example.com');
    await page.getByLabel('Пароль').fill('password123');
    await page.getByRole('button', { name: 'Увійти' }).click();
    await expect(page).toHaveURL(/\/uk\/schedule(?:\?.*)?$/u);

    await page.goto('/login');
    await expect(page).toHaveURL(/\/uk\/schedule(?:\?.*)?$/u);
  });

  test('invalid credentials are generic and clear', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Електронна пошта').fill('missing@example.com');
    await page.getByLabel('Пароль').fill('password123');
    await page.getByRole('button', { name: 'Увійти' }).click();

    await expect(
      page.getByText('Неправильна електронна пошта або пароль.'),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/uk\/login$/u);
  });

  test('an unavailable API produces actionable feedback', async ({ page }) => {
    await page.route('**/api/auth/login', (route) => route.abort());
    await page.goto('/login');
    await page.getByLabel('Електронна пошта').fill('alice@example.com');
    await page.getByLabel('Пароль').fill('password123');
    await page.getByRole('button', { name: 'Увійти' }).click();

    await expect(
      page.getByText(
        'Не вдалося з’єднатися із сервісом. Перевірте мережу й повторіть спробу.',
      ),
    ).toBeVisible();
  });

  test('the form sends only one request while submission is active', async ({
    page,
  }) => {
    let requests = 0;
    await page.route('**/api/auth/login', async (route) => {
      requests += 1;
      await new Promise((resolve) => setTimeout(resolve, 250));
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'INVALID_CREDENTIALS',
        }),
      });
    });
    await page.goto('/login');
    await page.getByLabel('Електронна пошта').fill('alice@example.com');
    await page.getByLabel('Пароль').fill('password123');
    const submit = page.getByRole('button', { name: 'Увійти' });

    await submit.dblclick({ delay: 10 });
    await expect(
      page.getByText('Неправильна електронна пошта або пароль.'),
    ).toBeVisible();
    expect(requests).toBe(1);
  });

  test('English routes, links, document language, and success destination stay localized', async ({
    page,
  }) => {
    await page.goto('/en/login');

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Register' })).toHaveAttribute(
      'href',
      '/en/register',
    );
    await expect(page.getByRole('link', { name: 'English' })).toHaveAttribute(
      'aria-current',
      'page',
    );

    await page.getByLabel('Email').fill('alice@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/en\/schedule(?:\?.*)?$/u);
  });

  test('language switching preserves the equivalent auth route', async ({
    page,
  }) => {
    await page.goto('/uk/register');
    await page.getByRole('link', { name: 'English' }).click();

    await expect(page).toHaveURL(/\/en\/register$/u);
    await expect(page.getByLabel('Name')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('unsupported locales are rejected', async ({ page }) => {
    const response = await page.goto('/fr/login');

    expect(response?.status()).toBe(404);
  });

  test('auth surface becomes a mobile bottom sheet and a borderless desktop form', async ({
    page,
  }) => {
    await page.goto('/uk/login');

    for (const width of [375, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(
        page.getByRole('heading', { name: 'Раді знову бачити' }),
      ).toBeVisible();
      const dimensions = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(
        dimensions.clientWidth,
      );
    }

    await page.setViewportSize({ width: 375, height: 900 });
    const authSurface = page.locator('main > section');
    const mobileBox = await authSurface.boundingBox();
    const mobileStyles = await authSurface.evaluate((element) => {
      const styles = window.getComputedStyle(element);
      return {
        borderTopLeftRadius: styles.borderTopLeftRadius,
        boxShadow: styles.boxShadow,
      };
    });

    expect(mobileBox).not.toBeNull();
    expect(Math.round((mobileBox?.y ?? 0) + (mobileBox?.height ?? 0))).toBe(
      900,
    );
    expect(mobileStyles.borderTopLeftRadius).not.toBe('0px');
    expect(mobileStyles.boxShadow).not.toBe('none');

    await page.setViewportSize({ width: 1024, height: 900 });
    const desktopStyles = await authSurface.evaluate((element) => {
      const styles = window.getComputedStyle(element);
      return {
        backgroundColor: styles.backgroundColor,
        borderTopWidth: styles.borderTopWidth,
        borderTopLeftRadius: styles.borderTopLeftRadius,
        boxShadow: styles.boxShadow,
      };
    });

    expect(desktopStyles).toMatchObject({
      backgroundColor: 'rgba(0, 0, 0, 0)',
      borderTopWidth: '0px',
      borderTopLeftRadius: '0px',
    });
    expect(desktopStyles.boxShadow).toMatch(/^(?:none|rgba\(0, 0, 0, 0\))/u);
  });

  test('English verification succeeds and removes the token from the URL', async ({
    page,
  }) => {
    const token = await registerThroughApi(page, 'en');
    await verifyThroughPage(page, 'en', token);
    await expect(page).toHaveURL(/\/en\/verify-email\?result=success$/u);
    await expect(page.getByText('Your email has been verified.')).toBeVisible();
  });

  test('English invalid verification is safe and localized', async ({
    page,
  }) => {
    await page.goto(`/en/verify-email?token=${'a'.repeat(43)}`);
    await page.getByRole('button', { name: 'Verify email' }).click();
    await expect(page).toHaveURL(/\/en\/verify-email\?result=invalid$/u);
    await expect(
      page.getByText(
        'This verification link is invalid, expired, or has already been used. Request a new link.',
      ),
    ).toBeVisible();
    await expect(page.getByText(/EMAIL_VERIFICATION/u)).toHaveCount(0);
  });

  test('Ukrainian invalid verification is safe and offers the public login path', async ({
    page,
  }) => {
    await page.goto(`/uk/verify-email?token=${'b'.repeat(43)}`);
    await page.getByRole('button', { name: 'Підтвердити пошту' }).click();
    await expect(page).toHaveURL(/\/uk\/verify-email\?result=invalid$/u);
    await expect(
      page.getByText(
        'Посилання недійсне, прострочене або вже використане. Запросіть нове посилання.',
      ),
    ).toBeVisible();
    await expect(
      page.getByRole('link', {
        name: 'Увійдіть, щоб запросити нове посилання.',
      }),
    ).toBeVisible();
  });

  test('expiry remains blocked until a fresh token is verified', async ({
    page,
  }) => {
    const token = await registerThroughApi(page, 'uk');
    await page.waitForTimeout(2_200);
    await verifyThroughPage(page, 'uk', token);
    await expect(
      page.getByText(
        'Посилання недійсне, прострочене або вже використане. Запросіть нове посилання.',
      ),
    ).toBeVisible();
    await page.goto('/uk/schedule');
    await expect(page.getByRole('banner')).toBeVisible();
    await page.waitForTimeout(5_100);

    const resend = await requestVerificationThroughApi(page, 'uk');
    await verifyThroughPage(page, 'uk', resend);
    await expect(page).toHaveURL(/\/uk\/verify-email\?result=success$/u);
    await page.goto('/uk/schedule');
    await page.reload();
    await expect(
      page.getByText(
        'Підтвердіть електронну пошту, щоб створити бронювання. Розклад кімнат залишається доступним.',
      ),
    ).toHaveCount(0);
  });

  test('resend supersedes the prior token', async ({ page }) => {
    const firstToken = await registerThroughApi(page, 'en');
    await page.waitForTimeout(5_100);
    const secondToken = await requestVerificationThroughApi(page, 'en');

    await verifyThroughPage(page, 'en', firstToken);
    await expect(
      page.getByText(
        'This verification link is invalid, expired, or has already been used. Request a new link.',
      ),
    ).toBeVisible();
    await verifyThroughPage(page, 'en', secondToken);
    await expect(page).toHaveURL(/\/en\/verify-email\?result=success$/u);

    const staleTokenResponse = await page.request.post(
      '/api/auth/email-verification/verify',
      { data: { token: firstToken } },
    );
    expect(staleTokenResponse.status()).toBe(400);
    await page.goto('/en/schedule');
    await page.reload();
    await expect(
      page.getByText(
        'Verify your email to create a meeting-room booking. Room schedules remain available.',
      ),
    ).toHaveCount(0);
  });

  test('resend cooldown is enforced by the API and rendered by the banner', async ({
    page,
  }) => {
    await registerThroughApi(page, 'en');
    const apiCooldown = await page.request.post(
      '/api/auth/email-verification/request',
      { data: { locale: 'en' } },
    );
    expect(apiCooldown.status()).toBe(429);
    expect(await apiCooldown.json()).toMatchObject({
      code: 'EMAIL_VERIFICATION_RATE_LIMITED',
      details: { retryAfterSeconds: expect.any(Number) },
    });
    await page.route('**/api/auth/email-verification/request', (route) =>
      route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'EMAIL_VERIFICATION_RATE_LIMITED',
          details: { retryAfterSeconds: 5 },
        }),
      }),
    );
    await page.goto('/en/schedule');
    const banner = page.getByRole('banner');
    await expect(banner).toBeVisible();
    const resendButton = page
      .locator('aside[aria-label="Verify your email"] button')
      .last();
    await expect(resendButton).toBeEnabled();
    await resendButton.click();
    await expect(
      page.getByText('Please wait before requesting another link.'),
    ).toBeVisible();
    await page.unroute('**/api/auth/email-verification/request');
    await page.waitForTimeout(5_100);
    await resendButton.click();
    await expect(
      page.getByText('A new verification link has been sent.'),
    ).toBeVisible();
  });

  test('two independent HTTP clients safely consume one token', async ({
    page,
  }) => {
    const token = await registerThroughApi(page, 'en');
    const firstClient = await request.newContext({
      baseURL: 'http://localhost:3101',
    });
    const secondClient = await request.newContext({
      baseURL: 'http://localhost:3101',
    });
    try {
      const responses = await Promise.all([
        firstClient.post('/api/auth/email-verification/verify', {
          data: { token },
        }),
        secondClient.post('/api/auth/email-verification/verify', {
          data: { token },
        }),
      ]);
      expect(responses.map((response) => response.status()).sort()).toEqual([
        200, 400,
      ]);
      expect(
        await responses.find((response) => response.status() === 400)?.json(),
      ).toEqual({
        code: 'EMAIL_VERIFICATION_INVALID_OR_EXPIRED',
      });
    } finally {
      await firstClient.dispose();
      await secondClient.dispose();
    }
    await expect(
      (await page.request.get('/api/auth/me')).json(),
    ).resolves.toMatchObject({
      user: { emailVerified: true },
    });
  });

  test('a verified token replay remains safe and does not require relogin', async ({
    page,
  }) => {
    const token = await registerThroughApi(page, 'en');
    await verifyThroughPage(page, 'en', token);

    const replay = await page.request.post(
      '/api/auth/email-verification/verify',
      { data: { token } },
    );
    expect(replay.status()).toBe(400);
    expect(await replay.json()).toEqual({
      code: 'EMAIL_VERIFICATION_INVALID_OR_EXPIRED',
    });
    await expect(
      (await page.request.get('/api/auth/me')).json(),
    ).resolves.toMatchObject({
      user: { emailVerified: true },
    });
    await page.goto('/en/schedule');
    await page.reload();
    await expect(
      page.getByText(
        'Verify your email to create a meeting-room booking. Room schedules remain available.',
      ),
    ).toHaveCount(0);
  });

  test('the booking gate keeps slots readable and enables booking without relogin', async ({
    page,
  }) => {
    const token = await registerThroughApi(page, 'uk');
    await page.goto('/uk/schedule');
    await expect(page.getByRole('banner')).toBeVisible();
    const availableSlot = page
      .locator('button[role="gridcell"]:not([disabled])')
      .first();
    await expect(availableSlot).toBeVisible();
    await availableSlot.click();
    await expect(page).toHaveURL(/\/uk\/verify-email\?reason=booking$/u);

    await verifyThroughPage(page, 'uk', token);
    await page.goto('/uk/schedule');
    await page.reload();
    await expect(
      page.getByText(
        'Підтвердіть електронну пошту, щоб створити бронювання. Розклад кімнат залишається доступним.',
      ),
    ).toHaveCount(0);
    await page
      .locator('button[role="gridcell"]:not([disabled])')
      .first()
      .click();
    await page.getByLabel('Назва зустрічі').fill('E2E verified booking');
    await page.getByRole('button', { name: 'Забронювати' }).click();
    await expect(page.getByText('Бронювання створено.')).toBeVisible();
  });
});

async function registerThroughApi(
  page: Page,
  locale: 'uk' | 'en',
): Promise<string> {
  const email = `verification-${locale}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  const response = await page.request.post('/api/auth/register', {
    data: {
      name: 'E2E Verification User',
      email,
      password: 'password123',
      locale,
    },
  });
  expect(response.status()).toBe(201);
  const body = (await response.json()) as {
    emailVerification: { developmentVerificationUrl: string };
  };
  const url = new URL(body.emailVerification.developmentVerificationUrl);
  const token = url.searchParams.get('token');
  if (!token) throw new Error('Expected a development verification token');
  return token;
}

async function requestVerificationThroughApi(
  page: Page,
  locale: 'uk' | 'en',
): Promise<string> {
  const response = await page.request.post(
    '/api/auth/email-verification/request',
    {
      data: { locale },
    },
  );
  expect(response.status()).toBe(200);
  const body = (await response.json()) as {
    developmentVerificationUrl: string;
  };
  const token = new URL(body.developmentVerificationUrl).searchParams.get(
    'token',
  );
  if (!token) throw new Error('Expected a development verification token');
  return token;
}

async function verifyThroughPage(
  page: Page,
  locale: 'uk' | 'en',
  token: string,
): Promise<void> {
  await page.goto(`/${locale}/verify-email?token=${encodeURIComponent(token)}`);
  await page
    .getByRole('button', {
      name: locale === 'uk' ? 'Підтвердити пошту' : 'Verify email',
    })
    .click();
  await expect(page).toHaveURL(
    new RegExp(`/${locale}/verify-email\\?result=(?:success|invalid)$`, 'u'),
  );
}
