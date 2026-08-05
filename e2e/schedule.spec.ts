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
    await expect(
      page.getByRole('option', { name: /Марс.*Floor 2.*6 people/u }),
    ).toBeVisible();
    await page
      .getByRole('option', { name: /Марс.*Floor 2.*6 people/u })
      .click();
    await expect(page).toHaveURL(/roomId=room-mars/u);
    await expect(page.getByText('Floor 2', { exact: true })).toBeVisible();
    await expect(page.getByText('6 people', { exact: true })).toBeVisible();

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

  test('creates a four-hour booking, renders eight slots, and allows adjacency', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const previousWeek = new URL(page.url()).searchParams.get('week');
    await page.getByRole('button', { name: 'Next week' }).click();
    await expect
      .poll(() => new URL(page.url()).searchParams.get('week'))
      .not.toBe(previousWeek);
    await expect(page.locator('[data-schedule-presentation]')).toHaveAttribute(
      'aria-busy',
      'false',
    );

    const findAvailableRun = async (slotCount: number) => {
      const run = await page
        .getByRole('gridcell', { name: /Available/u })
        .evaluateAll((cells, requestedSlotCount) => {
          const available = cells
            .map((cell) => ({
              id: cell.getAttribute('data-slot-id'),
              row: Number(cell.getAttribute('data-row')),
              startsAtUtc: Number(cell.getAttribute('data-starts-at-utc')),
            }))
            .filter(
              ({ id, row, startsAtUtc }) =>
                id && Number.isFinite(row) && Number.isFinite(startsAtUtc),
            )
            .sort((left, right) => left.startsAtUtc - right.startsAtUtc);
          for (
            let index = 0;
            index <= available.length - requestedSlotCount;
            index += 1
          ) {
            const candidate = available[index];
            if (!candidate) continue;
            const isConsecutive = Array.from(
              { length: requestedSlotCount },
              (_, offset) => available[index + offset],
            ).every(
              (slot, offset) =>
                slot?.startsAtUtc ===
                candidate.startsAtUtc + offset * 30 * 60 * 1000,
            );
            if (isConsecutive) return candidate;
          }
          return undefined;
        }, slotCount);
      expect(run).toBeTruthy();
      return run as { id: string; row: number; startsAtUtc: number };
    };

    const fourHourTitle = `Four hour E2E ${Date.now()}`;
    const fourHourRun = await findAvailableRun(8);
    await page.locator(`[data-slot-id="${fourHourRun.id}"]`).click();
    await expect(page.getByRole('button', { name: '4 hours' })).toBeEnabled();
    await page.getByRole('button', { name: '4 hours' }).click();
    await page.getByLabel('Meeting title').fill(fourHourTitle);
    await page.getByRole('button', { name: 'Book room' }).click();
    await expect(page.getByText('Booking created.')).toBeVisible();

    const fourHourBooking = page.getByRole('button', {
      name: new RegExp(`${fourHourTitle}.*Your booking`, 'u'),
    });
    await expect(fourHourBooking).toBeVisible();
    await expect
      .poll(() =>
        fourHourBooking.evaluate(
          (element) => getComputedStyle(element).gridRow,
        ),
      )
      .toBe(`${fourHourRun.row + 1} / span 8`);

    const adjacentTitle = `Adjacent E2E ${Date.now()}`;
    const adjacentSlot = page.locator(
      `[data-starts-at-utc="${fourHourRun.startsAtUtc + 4 * 60 * 60 * 1000}"]`,
    );
    await expect(adjacentSlot).toBeEnabled();
    await adjacentSlot.click();
    await page.getByRole('button', { name: '30 min' }).click();
    await page.getByLabel('Meeting title').fill(adjacentTitle);
    await page.getByRole('button', { name: 'Book room' }).click();
    await expect(page.getByText('Booking created.')).toBeVisible();
    await expect(
      page.getByRole('button', {
        name: new RegExp(`${adjacentTitle}.*Your booking`, 'u'),
      }),
    ).toBeVisible();

    for (const title of [adjacentTitle, fourHourTitle]) {
      const booking = page.getByRole('button', {
        name: new RegExp(`${title}.*Your booking`, 'u'),
      });
      await booking.click();
      await page.getByRole('button', { name: 'Cancel booking' }).click();
      await expect(page.getByText(/release the room/u)).toBeVisible();
      await page.getByRole('button', { name: 'Cancel booking' }).click();
      await expect(page.getByText('Booking cancelled.')).toBeVisible();
    }
  });

  test('creates, displays, inspects, and cancels an owned booking', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(
      page.locator('[data-schedule-presentation="compact"]'),
    ).toBeVisible();
    const previousWeek = new URL(page.url()).searchParams.get('week');
    await page.getByRole('button', { name: 'Next week' }).click();
    await expect
      .poll(() => new URL(page.url()).searchParams.get('week'))
      .not.toBe(previousWeek);
    await expect(
      page.locator('[data-schedule-presentation="compact"]'),
    ).toHaveAttribute('aria-busy', 'false');
    const title = `E2E schedule ${Date.now()}`;
    const availableSlots = page.getByRole('gridcell', { name: /Available/u });
    const lateSlotId = await availableSlots.evaluateAll((cells) => {
      const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Kyiv',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      });
      return cells
        .map((cell) => {
          const startsAtUtc = Number(cell.getAttribute('data-starts-at-utc'));
          const parts = formatter.formatToParts(startsAtUtc);
          return {
            id: cell.getAttribute('data-slot-id'),
            hour: parts.find((part) => part.type === 'hour')?.value,
            minute: parts.find((part) => part.type === 'minute')?.value,
          };
        })
        .find(({ hour, minute }) => hour === '18' && minute === '30')?.id;
    });
    expect(lateSlotId).toBeTruthy();
    const availableSlot = page.locator(`[data-slot-id="${lateSlotId ?? ''}"]`);
    await expect(availableSlot).toBeVisible();
    await availableSlot.click();
    await expect(page.getByRole('button', { name: '30 min' })).toBeEnabled();
    await expect(page.getByRole('button', { name: '1 hour' })).toBeDisabled();
    await expect(
      page.getByRole('button', { name: '1.5 hours' }),
    ).toBeDisabled();
    await expect(page.getByRole('button', { name: '2 hours' })).toBeDisabled();
    await expect(page.getByRole('alert')).toHaveCount(0);
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

  test('keeps the form open and reconciles duration after a booking conflict', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const previousWeek = new URL(page.url()).searchParams.get('week');
    await page.getByRole('button', { name: 'Next week' }).click();
    await expect
      .poll(() => new URL(page.url()).searchParams.get('week'))
      .not.toBe(previousWeek);
    await expect(
      page.locator('[data-schedule-presentation="compact"]'),
    ).toHaveAttribute('aria-busy', 'false');

    const availableSlots = page.getByRole('gridcell', { name: /Available/u });
    const slotId = await availableSlots.evaluateAll((cells) => {
      const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Kyiv',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      });
      return cells
        .map((cell) => {
          const startsAtUtc = Number(cell.getAttribute('data-starts-at-utc'));
          const parts = formatter.formatToParts(startsAtUtc);
          return {
            id: cell.getAttribute('data-slot-id'),
            hour: parts.find((part) => part.type === 'hour')?.value,
            minute: parts.find((part) => part.type === 'minute')?.value,
          };
        })
        .find(({ hour, minute }) => hour === '17' && minute === '30')?.id;
    });
    expect(slotId).toBeTruthy();
    const slot = page.locator(`[data-slot-id="${slotId ?? ''}"]`);
    const startsAtUtc = Number(await slot.getAttribute('data-starts-at-utc'));
    const roomId = new URL(page.url()).searchParams.get('roomId');
    if (!roomId || !Number.isFinite(startsAtUtc)) {
      throw new Error('Expected a selected room and valid slot');
    }
    await slot.click();
    const title = `E2E conflict ${Date.now()}`;
    await page.getByLabel('Meeting title').fill(title);
    await page.getByRole('button', { name: '1 hour' }).click();

    const browser = page.context().browser();
    if (!browser) throw new Error('Expected a browser context');
    const bobContext = await browser.newContext({
      baseURL: new URL(page.url()).origin,
    });
    try {
      const bobPage = await bobContext.newPage();
      await bobPage.goto('/en/login');
      await bobPage.getByLabel('Email').fill('bob@example.com');
      await bobPage.getByLabel('Password').fill('password123');
      await bobPage.getByRole('button', { name: 'Sign in' }).click();
      await expect(
        bobPage.getByRole('heading', { name: 'Weekly schedule' }),
      ).toBeVisible();
      const response = await bobPage.evaluate(
        async ({ roomId: selectedRoomId, startsAt }) => {
          const result = await fetch('/api/bookings', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              roomId: selectedRoomId,
              title: 'E2E conflicting booking',
              startsAtUtc: new Date(startsAt + 30 * 60_000).toISOString(),
              endsAtUtc: new Date(startsAt + 60 * 60_000).toISOString(),
            }),
          });
          const body = (await result.json()) as { booking?: { id?: string } };
          return { status: result.status, bookingId: body.booking?.id };
        },
        { roomId, startsAt: startsAtUtc },
      );
      expect(response.status).toBe(201);
      if (!response.bookingId)
        throw new Error('Expected a conflicting booking');

      await page.getByRole('button', { name: 'Book room' }).click();
      await expect(page.getByText('Conflict')).toBeVisible();
      await expect(page.getByLabel('Meeting title')).toHaveValue(title);
      await expect(page.getByRole('button', { name: '30 min' })).toBeEnabled();
      await page.getByRole('button', { name: '30 min' }).click();
      await page.getByRole('button', { name: 'Book room' }).click();
      await expect(page.getByText('Booking created.')).toBeVisible();
      const createdBooking = page.getByRole('button', {
        name: new RegExp(`${title}.*Your booking`, 'u'),
      });
      await expect(createdBooking).toBeVisible();
      await createdBooking.click();
      await page.getByRole('button', { name: 'Cancel booking' }).click();
      await expect(page.getByText(/release the room/u)).toBeVisible();
      await page.getByRole('button', { name: 'Cancel booking' }).click();
      await expect(page.getByText('Booking cancelled.')).toBeVisible();
      await expect(createdBooking).toHaveCount(0);
      await bobPage.evaluate(async (bookingId) => {
        await fetch(`/api/bookings/${bookingId}`, { method: 'DELETE' });
      }, response.bookingId);
    } finally {
      await bobContext.close();
    }
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
    await page.getByRole('button', { name: 'Next week' }).click();
    await expect(page.locator('[data-schedule-presentation]')).toHaveAttribute(
      'aria-busy',
      'false',
    );
    for (const viewport of [
      { width: 375, height: 812 },
      { width: 390, height: 844 },
      { width: 430, height: 932 },
    ]) {
      await page.setViewportSize(viewport);
      const grid = page.locator('[data-schedule-presentation="compact"]');
      await expect(grid).toBeVisible();
      const finalCell = grid
        .locator('button[role="gridcell"]:not([disabled])')
        .last();
      await finalCell.focus();
      const navigation = page.locator('[data-mobile-navigation]');
      await expect
        .poll(async () => {
          const [cellBox, navigationBox] = await Promise.all([
            finalCell.boundingBox(),
            navigation.boundingBox(),
          ]);
          return Boolean(
            cellBox &&
            navigationBox &&
            cellBox.y >= 0 &&
            cellBox.y + cellBox.height <= navigationBox.y,
          );
        })
        .toBe(true);
    }
  });

  test('associates and focuses the English title error', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.getByRole('button', { name: 'Next week' }).click();
    await expect(page.locator('[data-schedule-presentation]')).toHaveAttribute(
      'aria-busy',
      'false',
    );
    const availableSlot = page
      .getByRole('gridcell', { name: /Available/u })
      .first();
    await availableSlot.click();

    const dialog = page.getByRole('dialog', { name: 'Book a meeting room' });
    await expect(dialog).toBeVisible();
    const [dialogZIndex, navigationZIndex, submitBox] = await Promise.all([
      dialog.evaluate((element) =>
        Number.parseInt(getComputedStyle(element).zIndex, 10),
      ),
      page
        .locator('[data-mobile-navigation]')
        .evaluate((element) =>
          Number.parseInt(getComputedStyle(element).zIndex, 10),
        ),
      page.getByRole('button', { name: 'Book room' }).boundingBox(),
    ]);
    expect(dialogZIndex).toBeGreaterThan(navigationZIndex);
    expect(submitBox).not.toBeNull();
    expect((submitBox?.y ?? 0) + (submitBox?.height ?? 0)).toBeLessThanOrEqual(
      812,
    );

    const title = page.getByLabel('Meeting title');
    await page.getByRole('button', { name: 'Book room' }).click();

    await expect(title).toHaveAttribute('aria-invalid', 'true');
    await expect(title).toHaveAttribute(
      'aria-describedby',
      'booking-title-error',
    );
    await expect(page.locator('#booking-title-error')).toHaveText(
      'Enter a meeting title.',
    );
    await expect(title).toBeFocused();

    await title.fill('Planning');
    await expect(title).not.toHaveAttribute('aria-invalid');
    await expect(title).not.toHaveAttribute('aria-describedby');
    await expect(page.locator('#booking-title-error')).toHaveCount(0);
  });

  test('associates and focuses the Ukrainian title error', async ({ page }) => {
    await page.getByRole('button', { name: /Open user menu: Alice/u }).click();
    await page.getByRole('menuitem', { name: 'Українська' }).click();
    await expect(
      page.getByRole('heading', { name: 'Тижневий розклад' }),
    ).toBeVisible();
    await page.setViewportSize({ width: 375, height: 812 });
    await page.getByRole('button', { name: 'Наступний тиждень' }).click();
    await expect(page.locator('[data-schedule-presentation]')).toHaveAttribute(
      'aria-busy',
      'false',
    );

    await page
      .getByRole('gridcell', { name: /Вільно/u })
      .first()
      .click();
    const title = page.getByLabel('Назва зустрічі');
    await page.getByRole('button', { name: 'Забронювати' }).click();

    await expect(title).toHaveAttribute('aria-invalid', 'true');
    await expect(title).toHaveAttribute(
      'aria-describedby',
      'booking-title-error',
    );
    await expect(page.locator('#booking-title-error')).toHaveText(
      'Введіть назву зустрічі.',
    );
    await expect(title).toBeFocused();
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
