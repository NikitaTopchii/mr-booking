export function scheduleTimeBoundary(
  startsAtUtc: number,
  timeFormatter: Intl.DateTimeFormat,
): 'hour' | 'half-hour' {
  const minute = timeFormatter
    .formatToParts(startsAtUtc)
    .find((part) => part.type === 'minute')?.value;

  return minute === '00' ? 'hour' : 'half-hour';
}
