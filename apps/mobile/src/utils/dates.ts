/** '2026-07-10' or '2026-07-10T...' -> '07/10' (display formatting only). */
export function toMonthDay(isoDate: string): string {
  const datePart = isoDate.slice(0, 10);
  const [, month = '', day = ''] = datePart.split('-');
  return `${month}/${day}`;
}
