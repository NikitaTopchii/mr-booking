import { expect, test } from '@playwright/test';

test.describe('authenticated application shell', () => {
  test('protects both localized My bookings routes', async ({ page }) => {
    await page.goto('/uk/my-bookings');
    await expect(page).toHaveURL(/\/uk\/login$/u);

    await page.goto('/en/my-bookings');
    await expect(page).toHaveURL(/\/en\/login$/u);
  });

  test('renders Ukrainian identity, seeded bookings, reload, and localized logout', async ({
    page,
  }) => {
    await signIn(page, 'uk');

    await page.getByRole('link', { name: 'Мої бронювання' }).first().click();
    await expect(page).toHaveURL(/\/uk\/my-bookings$/u);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Мої бронювання' }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', {
        name: 'Відкрити в розкладі: Weekly planning',
      }),
    ).toBeVisible();
    await expect(
      page.getByText('Минулі бронювання з’являться тут.'),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Мої бронювання' }).first(),
    ).toHaveAttribute('aria-current', 'page');

    await page.reload();
    await expect(page).toHaveURL(/\/uk\/my-bookings$/u);

    await page
      .getByRole('button', { name: /Відкрити меню користувача: Alice/u })
      .click();
    await expect(page.getByText('alice@example.com')).toBeVisible();
    await page.getByRole('menuitem', { name: 'Вийти' }).click();
    await expect(page).toHaveURL(/\/uk\/login$/u);
  });

  test('preserves the current page when switching the shell to English', async ({
    page,
  }) => {
    await signIn(page, 'uk');
    await page.goto('/uk/my-bookings');
    await page
      .getByRole('button', { name: /Відкрити меню користувача: Alice/u })
      .click();
    await page.getByRole('menuitem', { name: 'English' }).click();

    await expect(page).toHaveURL(/\/en\/my-bookings$/u);
    await expect(
      page.getByRole('heading', { level: 1, name: 'My bookings' }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', {
        name: 'Open in schedule: Weekly planning',
      }),
    ).toHaveAttribute(
      'href',
      /\/en\/schedule\?date=\d{4}-\d{2}-\d{2}&week=\d{4}-\d{2}-\d{2}&roomId=room-aquarium/u,
    );
  });

  test('keeps navigation and the keyboard-operable user menu usable across target widths', async ({
    page,
  }) => {
    await signIn(page, 'en');
    await page.goto('/en/my-bookings');

    for (const width of [375, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const dimensions = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(
        dimensions.clientWidth,
      );
      await expect(
        page.getByRole('link', { name: 'My bookings' }).first(),
      ).toBeVisible();
    }

    await page.setViewportSize({ width: 375, height: 900 });
    const mobileNavigation = page.locator('[data-mobile-navigation]');
    const mobileNavigationBox = await mobileNavigation.boundingBox();
    expect(mobileNavigationBox).not.toBeNull();
    expect(mobileNavigationBox?.x).toBe(0);
    expect(mobileNavigationBox?.width).toBe(375);
    expect(
      (mobileNavigationBox?.y ?? 0) + (mobileNavigationBox?.height ?? 0),
    ).toBe(900);
    await expect(page.locator('[data-mobile-navigation-scrim]')).toBeVisible();
    await expect(page.locator('[data-mobile-navigation-scrim]')).toHaveCSS(
      'background-image',
      'none',
    );
    await expect(mobileNavigation).toHaveCSS('position', 'fixed');
    await expect(mobileNavigation).toHaveCSS('border-radius', '0px');
    await expect(
      mobileNavigation.getByRole('link', { name: 'My bookings' }),
    ).toHaveAttribute('aria-current', 'page');
    await mobileNavigation.getByRole('link', { name: 'Schedule' }).click();
    await expect(page).toHaveURL(/\/en\/schedule(?:\?.*)?$/u);
    await expect(
      mobileNavigation.getByRole('link', { name: 'Schedule' }),
    ).toHaveAttribute('aria-current', 'page');

    const menuButton = page.getByRole('button', {
      name: /Open user menu: Alice/u,
    });
    await menuButton.focus();
    await page.keyboard.press('Enter');
    await expect(
      page.getByRole('menuitem', { name: 'Sign out' }),
    ).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menuButton).toBeFocused();
  });
});

async function signIn(
  page: import('@playwright/test').Page,
  locale: 'uk' | 'en',
) {
  await page.goto(`/${locale}/login`);
  await page
    .getByLabel(locale === 'uk' ? 'Електронна пошта' : 'Email')
    .fill('alice@example.com');
  await page
    .getByLabel(locale === 'uk' ? 'Пароль' : 'Password')
    .fill('password123');
  await page
    .getByRole('button', { name: locale === 'uk' ? 'Увійти' : 'Sign in' })
    .click();
  await expect(page).toHaveURL(
    new RegExp(`/${locale}/schedule(?:\\?.*)?$`, 'u'),
  );
}
