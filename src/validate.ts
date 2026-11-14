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

export function today(now: number): string {
  const date = new Date(now);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
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
