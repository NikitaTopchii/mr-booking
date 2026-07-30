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
    await expect(page).toHaveURL(
      /date=\d{4}-\d{2}-\d{2}&week=\d{4}-\d{2}-\d{2}&roomId=.+/u,
    );
  });

  test('selects rooms, navigates stable week URLs, and preserves state by locale', async ({
    page,
  }) => {
    const roomSelect = page.getByRole('combobox', {
      name: 'Select meeting room',
    });
    await roomSelect.click();
    await page.getByRole('option', { name: /Марс/u }).click();
    await expect(page).toHaveURL(/roomId=room-mars/u);

    const currentUrl = page.url();
    await page.getByRole('button', { name: 'Next week' }).click();
    await expect(page).not.toHaveURL(currentUrl);
    await expect(page).toHaveURL(/week=\d{4}-\d{2}-\d{2}/u);

    await page.getByRole('button', { name: /Open user menu/u }).click();
    await page.getByRole('menuitem', { name: 'Українська' }).click();
    await expect(page).toHaveURL(
      /\/uk\/schedule\?date=.*&week=.*&roomId=room-mars/u,
    );
    await expect(
      page.getByRole('heading', { name: 'Тижневий розклад' }),
    ).toBeVisible();
  });

  test('creates, displays, inspects, and cancels an owned booking', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(
      page.locator('[data-schedule-presentation="compact"]'),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Next week' }).click();
    const title = `E2E schedule ${Date.now()}`;
    const availableSlot = page
      .getByRole('gridcell', { name: /Available/u })
      .first();
    await expect(availableSlot).toBeVisible();
    await availableSlot.click();
    await page.getByLabel('Meeting title').fill(title);
    await page.getByRole('button', { name: 'Book room' }).click();

    await expect(page.getByText('Booking created.')).toBeVisible();
    const booking = page.getByRole('button', {
      name: new RegExp(`${title}.*Your booking`, 'u'),
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
    for (const [width, expected] of [
      [375, 'compact'],
      [390, 'compact'],
      [768, 'medium'],
      [1024, 'expanded'],
      [1440, 'expanded'],
    ] as const) {
      await page.setViewportSize({
        width,
        height: width === 390 ? 844 : 900,
      });
      await expect(
        page.getByRole('grid', { name: 'Weekly schedule' }),
      ).toBeVisible();
      await expect(
        page.getByRole('combobox', { name: 'Select meeting room' }),
      ).toBeVisible();
      await expect(
        page.locator(`[data-schedule-presentation="${expected}"]`),
      ).toBeVisible();
      if (expected === 'compact') {
        await expect(
          page
            .getByRole('group', { name: 'Selected date' })
            .getByRole('button'),
        ).toHaveCount(7);
      }
      const dimensions = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(
        dimensions.clientWidth,
      );
    }
  });

  test('keeps the final compact slot above bottom navigation', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const grid = page.locator('[data-schedule-presentation="compact"]');
    await expect(grid).toBeVisible();
    await grid.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const finalCell = grid.getByRole('gridcell').last();
    const navigation = page.locator('[data-mobile-navigation]');
    const [cellBox, navigationBox] = await Promise.all([
      finalCell.boundingBox(),
      navigation.boundingBox(),
    ]);
    expect(cellBox).not.toBeNull();
    expect(navigationBox).not.toBeNull();
    if (!cellBox || !navigationBox) {
      throw new Error('Expected compact timeline and navigation bounds');
    }
    expect(cellBox.y + cellBox.height).toBeLessThanOrEqual(navigationBox.y);
  });
});

test.describe('schedule timezone rendering', () => {
  test.use({
    timezoneId: 'Europe/Lisbon',
    viewport: { width: 390, height: 844 },
  });

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

    await expect(page.getByText('Your time: Europe/Lisbon')).toBeVisible();
    await expect(
      page
        .getByRole('region', { name: 'Weekly schedule' })
        .getByText('Office hours: 09:00–19:00 Europe/Kyiv'),
    ).toBeVisible();
    await expect(
      page.getByRole('grid', { name: 'Weekly schedule' }),
    ).toBeVisible();
    await expect.poll(() => scheduleUrl).toContain('fromUtc=');
    const parsed = new URL(scheduleUrl);
    expect(parsed.searchParams.get('fromUtc')).toMatch(/\.000Z$/u);
    expect(parsed.searchParams.get('toUtc')).toMatch(/\.000Z$/u);
  });
});
