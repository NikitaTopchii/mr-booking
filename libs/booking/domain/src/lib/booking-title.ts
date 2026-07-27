import {
  BookingTitleRequiredError,
  BookingTitleTooLongError,
} from './booking-errors';

export const BOOKING_TITLE_MAX_LENGTH = 100;

export function normalizeBookingTitle(title: string): string {
  const normalizedTitle = title.trim();

  if (normalizedTitle.length === 0) {
    throw new BookingTitleRequiredError();
  }

  if (Array.from(normalizedTitle).length > BOOKING_TITLE_MAX_LENGTH) {
    throw new BookingTitleTooLongError();
  }

  return normalizedTitle;
}
