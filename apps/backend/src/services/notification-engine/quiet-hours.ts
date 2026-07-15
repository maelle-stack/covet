import type { QuietHours } from '@covet/shared-types';

/** "HH:MM" -> minutes since local midnight. */
export function parseLocalTime(time: string): number {
  const [h = '0', m = '0'] = time.split(':');
  return Number(h) * 60 + Number(m);
}

/** Local minutes-since-midnight for `now` in the given IANA timezone. */
export function localMinutesOfDay(now: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0') % 24;
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
  return hour * 60 + minute;
}

/**
 * Whether local time falls inside the quiet-hours window. Handles overnight
 * windows (e.g. 21:00 → 09:00, the spec default) and same-day windows.
 * A zero-length window means quiet hours are effectively off.
 */
export function isWithinQuietHours(localMinutes: number, quietHours: QuietHours): boolean {
  const start = parseLocalTime(quietHours.start);
  const end = parseLocalTime(quietHours.end);
  if (start === end) return false;
  if (start < end) return localMinutes >= start && localMinutes < end;
  // Overnight window.
  return localMinutes >= start || localMinutes < end;
}

/**
 * The next moment quiet hours end, as an ISO timestamp. Uses a
 * minutes-until-end calculation against the local clock; DST transitions
 * inside the window can shift the result by up to an hour, which is an
 * acceptable v1 approximation for "wait until morning."
 */
export function nextQuietHoursEnd(now: Date, timezone: string, quietHours: QuietHours): string {
  const local = localMinutesOfDay(now, timezone);
  const end = parseLocalTime(quietHours.end);
  const minutesUntilEnd = (end - local + 24 * 60) % (24 * 60) || 24 * 60;
  return new Date(now.getTime() + minutesUntilEnd * 60 * 1000).toISOString();
}
