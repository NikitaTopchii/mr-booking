import {
  BookingTitleRequiredError,
  BookingTitleTooLongError,
} from './booking-errors';
import { normalizeBookingTitle } from './booking-title';

describe('booking title', () => {
  it.each(['', '   ', '\n\t'])('rejects an empty normalized title', (title) => {
    expect(() => normalizeBookingTitle(title)).toThrow(
      BookingTitleRequiredError,
    );
  });

  it('accepts one character', () => {
    expect(normalizeBookingTitle('A')).toBe('A');
  });

  it('accepts exactly 100 Unicode characters', () => {
    expect(normalizeBookingTitle('ї'.repeat(100))).toBe('ї'.repeat(100));
  });

  it('rejects 101 Unicode characters', () => {
    expect(() => normalizeBookingTitle('🙂'.repeat(101))).toThrow(
      BookingTitleTooLongError,
    );
  });

  it('trims only outer whitespace', () => {
    expect(normalizeBookingTitle('  Design   review  ')).toBe(
      'Design   review',
    );
  });

  it.each(['Щотижнева зустріч', '設計レビュー', '🙂 planning'])(
    'preserves meaningful Unicode in %s',
    (title) => {
      expect(normalizeBookingTitle(title)).toBe(title);
    },
  );
});
