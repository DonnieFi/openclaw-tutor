const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]?\d|2[0-3]):[0-5]\d(\s?[ap]m)?$/i;

export function isDate(value: string): boolean {
  if (!DATE.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function isTime(value: string): boolean {
  return TIME.test(value.trim());
}

export function isTimeZone(value: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/** Calendar date for `now`. A saved IANA zone wins. Otherwise this is the gateway host's local date. */
export function today(now: number, timeZone?: string | null): string {
  if (timeZone) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date(now));
    const part = (type: string) => parts.find((entry) => entry.type === type)?.value ?? '';
    return `${part('year')}-${part('month')}-${part('day')}`;
  }
  const date = new Date(now);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

const MONTHS: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
  may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8, sep: 9, sept: 9, september: 9,
  oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
};

/**
 * Accepts YYYY-MM-DD or a Family Pack display date such as "Fri Oct 9".
 * A missing year uses the year that lands nearest today, preferring a date from two days ago through two weeks ahead.
 */
export function resolveCalendarDate(value: string, todayIso: string): string | null {
  const trimmed = value.trim();
  if (isDate(trimmed)) return trimmed;
  const withoutWeekday = trimmed.replace(/^(?:mon|tue|wed|thu|fri|sat|sun|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\.?,?\s+/i, '');
  const match = /^(?:(\d{1,2})\s+([A-Za-z]+)|([A-Za-z]+)\s+(\d{1,2}))(?:,?\s+(\d{4}))?$/.exec(withoutWeekday);
  if (!match) return null;
  const day = Number(match[1] ?? match[4]);
  const monthToken = match[2] ?? match[3];
  if (!monthToken) return null;
  const month = MONTHS[monthToken.toLowerCase()];
  if (!month || day < 1 || day > 31) return null;
  const explicitYear = match[5] ? Number(match[5]) : null;
  const baseYear = Number(todayIso.slice(0, 4));
  const years = explicitYear === null ? [baseYear - 1, baseYear, baseYear + 1] : [explicitYear];
  const candidates = years.flatMap((year) => {
    const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return isDate(iso) ? [iso] : [];
  });
  if (!candidates.length) return null;
  if (explicitYear !== null) return candidates[0] ?? null;
  const todayMs = Date.parse(`${todayIso}T12:00:00Z`);
  const scored = candidates.map((iso) => ({ iso, delta: Date.parse(`${iso}T12:00:00Z`) - todayMs }));
  const inWindow = scored.filter((entry) => entry.delta >= -2 * 86_400_000 && entry.delta <= 14 * 86_400_000);
  const pool = inWindow.length ? inWindow : scored;
  pool.sort((a, b) => Math.abs(a.delta) - Math.abs(b.delta) || a.delta - b.delta);
  return pool[0]?.iso ?? null;
}

export function addDays(day: string, days: number): string {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function weekday(day: string): string {
  return new Intl.DateTimeFormat('en-CA', { weekday: 'long', timeZone: 'UTC' })
    .format(new Date(`${day}T12:00:00Z`));
}

export function cleanText(value: string, label: string, max: number): string {
  const clean = value.trim();
  if (!clean) throw new Error(`${label} is required.`);
  if (clean.length > max) throw new Error(`${label} must be ${max} characters or fewer.`);
  return clean;
}

export function optionalText(value: string | undefined | null, max: number): string | null {
  if (value === undefined || value === null) return null;
  const clean = value.trim();
  if (!clean) return null;
  if (clean.length > max) throw new Error(`Text must be ${max} characters or fewer.`);
  return clean;
}

export function normalize(value: string): string {
  return value.trim().toLocaleLowerCase('en-CA').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

export function keyOf(...parts: string[]): string {
  return parts.map(normalize).join('|');
}

export function words(value: string): string[] {
  return value.toLocaleLowerCase('en-CA').match(/[\p{L}\p{N}]+/gu) ?? [];
}

export function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

export function asStringArray(value: unknown, max: number): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string').slice(0, max)
    : [];
}
