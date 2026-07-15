import {
  isWithinQuietHours,
  localMinutesOfDay,
  nextQuietHoursEnd,
  parseLocalTime,
} from './quiet-hours';

const QUIET = { start: '21:00', end: '09:00' };

describe('parseLocalTime', () => {
  it('parses HH:MM into minutes', () => {
    expect(parseLocalTime('21:00')).toBe(1260);
    expect(parseLocalTime('09:00')).toBe(540);
    expect(parseLocalTime('00:00')).toBe(0);
  });
});

describe('localMinutesOfDay', () => {
  it('converts UTC to the local wall clock of the given timezone', () => {
    // 16:00 UTC = 12:00 in New York during EDT.
    expect(localMinutesOfDay(new Date('2026-07-04T16:00:00Z'), 'America/New_York')).toBe(12 * 60);
  });
});

describe('isWithinQuietHours (overnight 21:00 → 09:00 default)', () => {
  it('is quiet late at night and early morning', () => {
    expect(isWithinQuietHours(parseLocalTime('23:30'), QUIET)).toBe(true);
    expect(isWithinQuietHours(parseLocalTime('02:00'), QUIET)).toBe(true);
    expect(isWithinQuietHours(parseLocalTime('08:59'), QUIET)).toBe(true);
  });

  it('is not quiet during the day', () => {
    expect(isWithinQuietHours(parseLocalTime('09:00'), QUIET)).toBe(false);
    expect(isWithinQuietHours(parseLocalTime('12:00'), QUIET)).toBe(false);
    expect(isWithinQuietHours(parseLocalTime('20:59'), QUIET)).toBe(false);
  });

  it('handles same-day windows too', () => {
    const daytime = { start: '13:00', end: '15:00' };
    expect(isWithinQuietHours(parseLocalTime('14:00'), daytime)).toBe(true);
    expect(isWithinQuietHours(parseLocalTime('16:00'), daytime)).toBe(false);
  });

  it('a zero-length window disables quiet hours', () => {
    expect(isWithinQuietHours(parseLocalTime('23:00'), { start: '09:00', end: '09:00' })).toBe(
      false,
    );
  });
});

describe('nextQuietHoursEnd', () => {
  it('defers a late-night notification to 9am local time', () => {
    // 03:00 UTC on Jul 5 = 23:00 Jul 4 in New York -> next 9am NY is 13:00 UTC Jul 5.
    const result = nextQuietHoursEnd(new Date('2026-07-05T03:00:00Z'), 'America/New_York', QUIET);
    expect(result).toBe('2026-07-05T13:00:00.000Z');
  });
});
