import {
  bookingAuthorColor,
  bookingAuthorForeground,
} from './booking-author-color';

describe('bookingAuthorColor', () => {
  it('assigns a stable controlled color from the safe author identifier', () => {
    expect(bookingAuthorColor('author-42')).toBe(
      bookingAuthorColor('author-42'),
    );
    expect(bookingAuthorColor('author-42')).toMatch(
      /^(terracotta|olive|ochre|wine|teal|slate|blue-grey|clay)$/u,
    );
  });

  it('keeps multiple foreign authors distinct while ignoring booking identity', () => {
    const authorA = bookingAuthorColor('foreign-author-a');
    const authorB = bookingAuthorColor('foreign-author-b');
    const authorC = bookingAuthorColor('foreign-author-c');

    expect(new Set([authorA, authorB, authorC]).size).toBe(3);
    expect(bookingAuthorColor('foreign-author-a')).toBe(authorA);
    expect(bookingAuthorColor('foreign-author-a')).not.toBe(
      bookingAuthorColor('foreign-author-b'),
    );
  });

  it('chooses a controlled foreground treatment for every color', () => {
    expect(bookingAuthorForeground('ochre')).toBe('dark');
    expect(bookingAuthorForeground('blue-grey')).toBe('dark');
    expect(bookingAuthorForeground('teal')).toBe('light');
  });
});
