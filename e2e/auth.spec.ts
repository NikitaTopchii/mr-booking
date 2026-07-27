import { expect, test } from '@playwright/test';

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

    await expect(page).toHaveURL(/\/uk\/schedule$/u);
    const userMenu = page.getByRole('button', {
      name: 'Відкрити меню користувача: E2E User',
    });
    await userMenu.click();
    await expect(page.getByText(email)).toBeVisible();
    await page.keyboard.press('Escape');
    await page.reload();
    await expect(page).toHaveURL(/\/uk\/schedule$/u);
    await userMenu.click();
    await expect(page.getByText(email)).toBeVisible();

    await page.getByRole('menuitem', { name: 'Вийти' }).click();
    await expect(page).toHaveURL(/\/uk\/login$/u);
    expect((await page.request.get('/api/auth/me')).status()).toBe(401);
    await page.goBack();
    await expect(page).not.toHaveURL(/\/uk\/schedule$/u);
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
    await expect(page).toHaveURL(/\/uk\/schedule$/u);

    await page.goto('/login');
    await expect(page).toHaveURL(/\/uk\/schedule$/u);
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
    await expect(page).toHaveURL(/\/en\/schedule$/u);
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
});
