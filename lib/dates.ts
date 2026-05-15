import { fromZonedTime } from "date-fns-tz";

// Server: parse an incoming date string using the user's timezone as fallback.
// Strings that already carry timezone info (ends with Z or ±HH:MM) are passed through as-is.
export function parseDateParam(value: string, timezone: string): Date {
  const hasTz = /Z$|[+-]\d{2}:?\d{2}$/.test(value.trim());
  if (hasTz) return new Date(value);
  return fromZonedTime(value, timezone);
}

// Client/CLI: convert a YYYY-MM-DD from an HTML date input to start-of-day ISO
// in the browser or machine's local timezone.
export function localStartOfDay(dateStr: string): string {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return fromZonedTime(`${dateStr}T00:00:00`, tz).toISOString();
}

// Client/CLI: convert a YYYY-MM-DD to end-of-day ISO in local timezone.
export function localEndOfDay(dateStr: string): string {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return fromZonedTime(`${dateStr}T23:59:59.999`, tz).toISOString();
}

// A bare date with no time context means start of that day.
export const localDayToISO = localStartOfDay;
