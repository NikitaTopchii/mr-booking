import { expect, test, type Page } from '@playwright/test';

test.describe('room capacity filter', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, 'en');
  });

  test('filters seeded rooms, preserves date, reloads, and clears', async ({
    page,
  }) => {
    const initialState = new URL(page.url()).searchParams;
    const scheduleRequests: string[] = [];
    page.on('request', (request) => {
      if (/\/api\/rooms\/[^/]+\/bookings\?/u.test(request.url())) {
        scheduleRequests.push(request.url());
      }
    });

    await page.getByLabel('Minimum capacity').fill('6');
    await page.getByRole('button', { name: 'Apply filter' }).click();
    await expect(page).toHaveURL(/minCapacity=6/u);
    await expect(page).toHaveURL(/roomId=room-gagarin/u);
    expect(new URL(page.url()).searchParams.get('date')).toBe(
      initialState.get('date'),
    );
    expect(new URL(page.url()).searchParams.get('week')).toBe(
      initialState.get('week'),
    );
    await expect(
      page.getByRole('combobox', { name: 'Select meeting room' }),
    ).toContainText('Гагарін');

    await page.getByRole('combobox', { name: 'Select meeting room' }).click();
    await expect(page.getByRole('option', { name: /Гагарін/u })).toBeVisible();
    await expect(page.getByRole('option', { name: /Акваріум/u })).toHaveCount(
      0,
    );
    await page.keyboard.press('Escape');
    await expect
      .poll(() => scheduleRequests.at(-1) ?? '')
      .toContain('/api/rooms/room-gagarin/bookings?');

    await page.reload();
    await expect(page).toHaveURL(
      /roomId=room-gagarin&.*minCapacity=6|.*minCapacity=6.*roomId=room-gagarin/u,
    );
    await expect(page.getByLabel('Minimum capacity')).toHaveValue('6');

    await page.getByRole('button', { name: 'Clear filter' }).click();
    await expect(page).not.toHaveURL(/minCapacity=/u);
    expect(new URL(page.url()).searchParams.get('date')).toBe(
      initialState.get('date'),
    );
    await page.getByRole('combobox', { name: 'Select meeting room' }).click();
    await expect(page.getByRole('option', { name: /Акваріум/u })).toBeVisible();
  });

  test('shows a dedicated no-match state and makes no schedule request', async ({
    page,
  }) => {
    const scheduleRequests: string[] = [];
    page.on('request', (request) => {
      if (/\/api\/rooms\/[^/]+\/bookings\?/u.test(request.url())) {
        scheduleRequests.push(request.url());
      }
    });
    await expect(
      page.getByRole('grid', { name: 'Weekly schedule' }),
    ).toBeVisible();
    const initialRequestCount = scheduleRequests.length;

    await page.getByLabel('Minimum capacity').fill('20');
    await page.getByRole('button', { name: 'Apply filter' }).click();
    await expect(
      page.getByText('No rooms can accommodate at least 20 people.'),
    ).toBeVisible();
    await expect(page).toHaveURL(/minCapacity=20/u);
    await expect.poll(() => scheduleRequests.length).toBe(initialRequestCount);
    await expect(
      page.getByRole('combobox', { name: 'Select meeting room' }),
    ).toBeDisabled();

    const noMatchState = page
      .locator('[role="status"]')
      .filter({ hasText: 'No rooms can accommodate at least 20 people.' });
    await noMatchState.getByRole('button', { name: 'Clear filter' }).click();
    await expect(page).not.toHaveURL(/minCapacity=/u);
    await expect(
      page.getByRole('grid', { name: 'Weekly schedule' }),
    ).toBeVisible();
  });

  test('restores previous filter state with Back and Forward', async ({
    page,
  }) => {
    await page.getByLabel('Minimum capacity').fill('6');
    await page.getByRole('button', { name: 'Apply filter' }).click();
    await expect(page).toHaveURL(/minCapacity=6/u);
    await expect(page).toHaveURL(/roomId=room-gagarin/u);

    await page.getByLabel('Minimum capacity').fill('10');
    await page.getByRole('button', { name: 'Apply filter' }).click();
    await expect(page).toHaveURL(/minCapacity=10/u);
    await expect(page).toHaveURL(/roomId=room-dnipro/u);

    await page.goBack();
    await expect(page).toHaveURL(/minCapacity=6/u);
    await expect(page).toHaveURL(/roomId=room-gagarin/u);
    await page.goForward();
    await expect(page).toHaveURL(/minCapacity=10/u);
    await expect(page).toHaveURL(/roomId=room-dnipro/u);
  });

  test('applies the filter with Enter and preserves the complete route state', async ({
    page,
  }) => {
    const initialState = new URL(page.url()).searchParams;

    await page.getByLabel('Minimum capacity').fill('10');
    await page.getByLabel('Minimum capacity').press('Enter');

    await expect(page).toHaveURL(/minCapacity=10/u);
    const nextState = new URL(page.url()).searchParams;
    expect(nextState.get('date')).toBe(initialState.get('date'));
    expect(nextState.get('week')).toBe(initialState.get('week'));
    expect(nextState.get('roomId')).toBe('room-dnipro');
    await expect(
      page.getByRole('grid', { name: 'Weekly schedule' }),
    ).toBeVisible();
  });

  test('keeps the capacity filter when date and room route writers run', async ({
    page,
  }) => {
    await page.getByLabel('Minimum capacity').fill('6');
    await page.getByRole('button', { name: 'Apply filter' }).click();
    await expect(page).toHaveURL(/minCapacity=6/u);

    await page.getByRole('button', { name: 'Next week' }).click();
    await expect(page).toHaveURL(/minCapacity=6/u);

    await page.getByRole('combobox', { name: 'Select meeting room' }).click();
    await page.getByRole('option', { name: /Дніпро/u }).click();
    await expect(page).toHaveURL(/minCapacity=6/u);
  });

  test('works in Ukrainian on a compact viewport without horizontal overflow', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/uk/schedule');
    await expect(
      page.getByRole('region', { name: 'Тижневий розклад' }),
    ).toBeVisible();
    await expect(page).toHaveURL(
      /\/uk\/schedule\?date=\d{4}-\d{2}-\d{2}&week=\d{4}-\d{2}-\d{2}&roomId=.+/u,
    );
    const initialState = new URL(page.url()).searchParams;
    await page.getByLabel('Мінімальна місткість').fill('10');
    await page.getByLabel('Мінімальна місткість').press('Enter');
    await expect(page).toHaveURL(/minCapacity=10/u);
    const nextState = new URL(page.url()).searchParams;
    expect(nextState.get('date')).toBe(initialState.get('date'));
    expect(nextState.get('week')).toBe(initialState.get('week'));
    expect(nextState.get('roomId')).toBeTruthy();
    await expect(page.getByText('Фільтр місткості активний')).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
    await expect(
      page.getByRole('grid', { name: 'Тижневий розклад' }),
    ).toBeVisible();
    await expect(
      page.getByRole('status', { name: /Обрана кімната/u }),
    ).toContainText('Поверх');
  });
});

async function signIn(page: Page, locale: 'en' | 'uk'): Promise<void> {
  await page.goto(`/${locale}/login`);
  await page
    .getByLabel(locale === 'en' ? 'Email' : 'Електронна пошта')
    .fill('alice@example.com');
  await page
    .getByLabel(locale === 'en' ? 'Password' : 'Пароль')
    .fill('password123');
  await page
    .getByRole('button', { name: locale === 'en' ? 'Sign in' : 'Увійти' })
    .click();
  await expect(page).toHaveURL(
    new RegExp(`/${locale}/schedule(?:\\?.*)?$`, 'u'),
  );
  await expect(page).toHaveURL(
    new RegExp(
      `/${locale}/schedule\\?date=\\d{4}-\\d{2}-\\d{2}&week=\\d{4}-\\d{2}-\\d{2}&roomId=.+`,
      'u',
    ),
  );
  await expect(
    page.getByRole('heading', {
      name: locale === 'en' ? 'Weekly schedule' : 'Тижневий розклад',
    }),
  ).toBeVisible();
}
