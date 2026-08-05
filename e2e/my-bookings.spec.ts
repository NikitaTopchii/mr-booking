import { expect, test, type Page } from '@playwright/test';
import Database from 'better-sqlite3';

const historyPrefix = 'E2E history';

test.beforeAll(() => {
  seedPastBookings();
});

test.describe('My bookings', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAlice(page);
  });

  test('shows ordered history, loads the next cursor page, navigates, and cancels an upcoming booking', async ({
    page,
  }) => {
    const title = `My bookings cancellation ${Date.now()}`;
    const created = await createUpcomingBooking(page, title);

    await page.goto('/en/my-bookings');
    await expect(
      page.getByRole('heading', { name: 'My bookings', exact: true }),
    ).toBeVisible();
    const upcomingLink = page.getByRole('link', {
      name: `Open in schedule: ${title}`,
    });
    await expect(upcomingLink).toHaveAttribute(
      'href',
      new RegExp(
        `/en/schedule\\?date=\\d{4}-\\d{2}-\\d{2}&week=\\d{4}-\\d{2}-\\d{2}&roomId=${created.roomId}`,
        'u',
      ),
    );
    await expect(page.getByText('Bob private history')).toHaveCount(0);

    await upcomingLink
      .locator('..')
      .getByRole('button', { name: 'Cancel booking' })
      .click();
    const dialog = page.getByRole('dialog', { name: 'Cancel booking?' });
    await expect(dialog.getByText(title)).toBeVisible();
    await expect(dialog.getByText('Марс')).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancel booking' }).click();
    await expect(page.getByText('Booking cancelled.')).toBeVisible();
    await expect(upcomingLink).toHaveCount(0);

    await expect(
      page.getByRole('link', { name: `Open in schedule: ${historyPrefix} 20` }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: `Open in schedule: ${historyPrefix} 00` }),
    ).toHaveCount(0);
    await page.getByRole('button', { name: 'Load more' }).click();
    const oldest = page.getByRole('link', {
      name: `Open in schedule: ${historyPrefix} 00`,
    });
    await expect(oldest).toBeVisible();
    await expect(
      page.getByRole('link', { name: /Open in schedule: E2E history/u }),
    ).toHaveCount(21);

    await oldest.click();
    await expect(page).toHaveURL(
      /\/en\/schedule\?date=\d{4}-\d{2}-\d{2}&week=\d{4}-\d{2}-\d{2}&roomId=room-kyiv/u,
    );
    await expect(
      page.getByRole('heading', { name: 'Weekly schedule' }),
    ).toBeVisible();
  });

  test('keeps the page usable at required viewport sizes', async ({ page }) => {
    await page.goto('/en/my-bookings');

    for (const viewport of [
      { width: 375, height: 812 },
      { width: 390, height: 844 },
      { width: 430, height: 932 },
      { width: 768, height: 900 },
      { width: 1024, height: 900 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      await expect(
        page.getByRole('heading', { name: 'My bookings', exact: true }),
      ).toBeVisible();
      const dimensions = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(
        dimensions.clientWidth,
      );

      if (viewport.width < 640) {
        const navigation = page.locator('[data-mobile-navigation]');
        const finalBookingLink = page
          .getByRole('link', { name: /Open in schedule:/u })
          .last();
        await finalBookingLink.focus();
        await expect
          .poll(async () => {
            const [linkBox, navigationBox] = await Promise.all([
              finalBookingLink.boundingBox(),
              navigation.boundingBox(),
            ]);
            return Boolean(
              linkBox &&
              navigationBox &&
              linkBox.y >= 0 &&
              linkBox.y + linkBox.height <= navigationBox.y,
            );
          })
          .toBe(true);
      }
    }
  });
});

test.describe('My bookings timezone navigation', () => {
  test.use({ timezoneId: 'Pacific/Honolulu' });

  test('renders browser-local time and computes the local Monday link', async ({
    page,
  }) => {
    await loginAsAlice(page);
    await page.goto('/en/my-bookings');

    await expect(page.getByText(/Pacific\/Honolulu/u)).toBeVisible();
    await expect(
      page.getByRole('link', {
        name: `Open in schedule: ${historyPrefix} 20`,
      }),
    ).toHaveAttribute(
      'href',
      '/en/schedule?date=2026-07-26&week=2026-07-20&roomId=room-kyiv',
    );
  });
});

async function loginAsAlice(page: Page): Promise<void> {
  await page.goto('/en/login');
  await page.getByLabel('Email').fill('alice@example.com');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(
    page.getByRole('heading', { name: 'Weekly schedule' }),
  ).toBeVisible();
}

async function createUpcomingBooking(
  page: Page,
  title: string,
): Promise<{ readonly roomId: string }> {
  const startsAt = new Date(Date.now() + 12 * 24 * 60 * 60 * 1_000);
  startsAt.setUTCHours(10, 0, 0, 0);
  const response = await page.request.post('/api/bookings', {
    data: {
      roomId: 'room-mars',
      title,
      startsAtUtc: startsAt.toISOString(),
      endsAtUtc: new Date(startsAt.getTime() + 60 * 60 * 1_000).toISOString(),
    },
  });
  expect(response.status()).toBe(201);
  return { roomId: 'room-mars' };
}

function seedPastBookings(): void {
  const databasePath = process.env['E2E_DATABASE_PATH'];
  if (!databasePath) {
    throw new Error('E2E_DATABASE_PATH is required');
  }
  const database = new Database(databasePath);
  const alice = database
    .prepare('SELECT id FROM users WHERE normalized_email = ?')
    .get('alice@example.com') as { readonly id: string } | undefined;
  const bob = database
    .prepare('SELECT id FROM users WHERE normalized_email = ?')
    .get('bob@example.com') as { readonly id: string } | undefined;
  if (!alice || !bob) {
    database.close();
    throw new Error('Seeded E2E users are required');
  }

  const insertBooking = database.prepare(
    'INSERT OR IGNORE INTO bookings (id, room_id, author_user_id, title, starts_at_utc, ends_at_utc, created_at_utc, cancelled_at_utc) VALUES (?, ?, ?, ?, ?, ?, ?, NULL)',
  );
  const insertSlot = database.prepare(
    'INSERT OR IGNORE INTO booking_slots (booking_id, room_id, slot_starts_at_utc) VALUES (?, ?, ?)',
  );
  const insertHistory = database.transaction(() => {
    for (let index = 0; index < 21; index += 1) {
      const startsAtUtc =
        index === 20
          ? Date.UTC(2026, 6, 27, 6)
          : Date.UTC(2026, 5, index + 1, 6);
      const bookingId = `e2e-history-${String(index).padStart(2, '0')}`;
      insertBooking.run(
        bookingId,
        'room-kyiv',
        alice.id,
        `${historyPrefix} ${String(index).padStart(2, '0')}`,
        startsAtUtc,
        startsAtUtc + 60 * 60 * 1_000,
        startsAtUtc - 24 * 60 * 60 * 1_000,
      );
      insertSlot.run(bookingId, 'room-kyiv', startsAtUtc);
      insertSlot.run(bookingId, 'room-kyiv', startsAtUtc + 30 * 60 * 1_000);
    }
    const foreignStart = Date.UTC(2026, 6, 26, 6);
    insertBooking.run(
      'e2e-foreign-history',
      'room-kyiv',
      bob.id,
      'Bob private history',
      foreignStart,
      foreignStart + 60 * 60 * 1_000,
      foreignStart - 24 * 60 * 60 * 1_000,
    );
  });
  insertHistory();
  database.close();
}
