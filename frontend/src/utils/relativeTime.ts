export function formatRelativeTime(iso: string, locale: string, now = Date.now()): string {
  const timestamp = new Date(iso).getTime();
  if (Number.isNaN(timestamp)) return '';
  const diffMs = timestamp - now;
  const absMs = Math.abs(diffMs);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;

  if (absMs < minute) return rtf.format(0, 'second');
  if (absMs < hour) return rtf.format(Math.round(diffMs / minute), 'minute');
  if (absMs < day) return rtf.format(Math.round(diffMs / hour), 'hour');
  if (absMs < week) return rtf.format(Math.round(diffMs / day), 'day');
  if (absMs < month) return rtf.format(Math.round(diffMs / week), 'week');
  return rtf.format(Math.round(diffMs / month), 'month');
}

export function formatClock(date: Date, locale: string): string {
  return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}

export function formatShortDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}
