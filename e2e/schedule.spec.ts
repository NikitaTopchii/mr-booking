import { expect, test } from '@playwright/test';

test.describe('interactive weekly schedule', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/login');
    await page.getByLabel('Email').fill('alice@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(
      page.getByRole('heading', { name: 'Weekly schedule' }),
    ).toBeVisible();
    await expect(page).toHaveURL(/roomId=.*&week=\d{4}-\d{2}-\d{2}/u);
  });

  test('selects rooms, navigates stable week URLs, and preserves state by locale', async ({
    page,
  }) => {
    const roomSelect = page.getByRole('combobox', { name: 'Meeting room' });
    await roomSelect.click();
    await page.getByRole('option', { name: /Марс/u }).click();
    await expect(page).toHaveURL(/roomId=room-mars/u);

    const currentUrl = page.url();
    await page.getByRole('button', { name: 'Next week' }).click();
    await expect(page).not.toHaveURL(currentUrl);
    await expect(page).toHaveURL(/week=\d{4}-\d{2}-\d{2}/u);

    await page.getByRole('button', { name: /Open user menu/u }).click();
    await page.getByRole('menuitem', { name: 'Українська' }).click();
    await expect(page).toHaveURL(/\/uk\/schedule\?roomId=room-mars&week=/u);
    await expect(
      page.getByRole('heading', { name: 'Тижневий розклад' }),
    ).toBeVisible();
  });

  test('creates, displays, inspects, and cancels an owned booking', async ({
    page,
  }) => {
    const title = `E2E schedule ${Date.now()}`;
    await page
      .getByRole('gridcell', { name: /Available/u })
      .first()
      .click();
    await page.getByLabel('Meeting title').fill(title);
    await page.getByRole('button', { name: 'Book room' }).click();

    await expect(page.getByText('Booking created.')).toBeVisible();
    const booking = page.getByRole('button', {
      name: new RegExp(`${title}, Booked by Alice`, 'u'),
    });
    await expect(booking).toBeVisible();
    await booking.click();
    await expect(page.getByRole('dialog', { name: title })).toBeVisible();
    await page.getByRole('button', { name: 'Cancel booking' }).click();
    await expect(page.getByText(/release the room/u)).toBeVisible();
    await page.getByRole('button', { name: 'Cancel booking' }).click();

    await expect(page.getByText('Booking cancelled.')).toBeVisible();
    await expect(booking).toHaveCount(0);
  });

  test('keeps the manual grid usable at required viewport sizes', async ({
    page,
  }) => {
    for (const width of [375, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(
        page.getByRole('grid', { name: 'Weekly schedule' }),
      ).toBeVisible();
      await expect(
        page.getByRole('combobox', { name: 'Meeting room' }),
      ).toBeVisible();
      const dimensions = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(
        dimensions.clientWidth,
      );
    }
  });
});

test.describe('schedule timezone rendering', () => {
  test.use({ timezoneId: 'America/New_York' });

  test('uses browser-local labels while querying absolute ISO ranges', async ({
    page,
  }) => {
    let scheduleUrl = '';
    page.on('request', (request) => {
      if (/\/api\/rooms\/.+\/bookings\?/u.test(request.url())) {
        scheduleUrl = request.url();
      }
    });
    await page.goto('/en/login');
    await page.getByLabel('Email').fill('bob@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText(/America\/New_York/u)).toBeVisible();
    await expect(
      page.getByRole('grid', { name: 'Weekly schedule' }),
    ).toBeVisible();
    await expect.poll(() => scheduleUrl).toContain('fromUtc=');
    const parsed = new URL(scheduleUrl);
    expect(parsed.searchParams.get('fromUtc')).toMatch(/\.000Z$/u);
    expect(parsed.searchParams.get('toUtc')).toMatch(/\.000Z$/u);
  });
});
