import type {
  BookingAuthorColor,
  BookingAuthorForeground,
} from './types/booking-author-color.types';

const AUTHOR_COLOR_NAMES: readonly BookingAuthorColor[] = [
  'terracotta',
  'olive',
  'ochre',
  'wine',
  'teal',
  'slate',
  'blue-grey',
  'clay',
] as const;
const FALLBACK_AUTHOR_COLOR: BookingAuthorColor = 'terracotta';

/**
 * Keeps a foreign author's presentation color stable without making color an
 * identity or authorization source. The API-provided author ID is already a
 * safe schedule DTO field; name and icon remain visible ownership cues.
 */
export function bookingAuthorColor(authorId: string): BookingAuthorColor {
  let hash = 0;

  for (const character of authorId) {
    hash = (hash * 31 + character.charCodeAt(0)) | 0;
  }

  return (
    AUTHOR_COLOR_NAMES[Math.abs(hash) % AUTHOR_COLOR_NAMES.length] ??
    FALLBACK_AUTHOR_COLOR
  );
}

export function bookingAuthorForeground(
  color: BookingAuthorColor,
): BookingAuthorForeground {
  return color === 'ochre' || color === 'blue-grey' ? 'dark' : 'light';
}
