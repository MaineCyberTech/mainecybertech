/** Shared date/currency formatting helpers. Unparseable values render as "—". */

const EMPTY = "—";

function toDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value: unknown): string {
  const date = toDate(value);
  return date ? date.toISOString().slice(0, 10) : EMPTY;
}

export function formatDateShort(value: unknown): string {
  const date = toDate(value);
  return date
    ? date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    : EMPTY;
}

export function formatDateTime(value: unknown): string {
  const date = toDate(value);
  return date
    ? date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : EMPTY;
}

export function formatDateUtc(value: unknown): string {
  const date = toDate(value);
  return date ? date.toLocaleDateString("en-US", { timeZone: "UTC" }) : EMPTY;
}

export function formatDateTimeUtc(value: unknown): string {
  const date = toDate(value);
  return date ? date.toLocaleString("en-US", { timeZone: "UTC" }) : EMPTY;
}

export function formatDateTimeMinutesUtc(value: unknown): string {
  const date = toDate(value);
  return date ? date.toISOString().slice(0, 16).replace("T", " ") : EMPTY;
}

export function formatTime(value: unknown): string {
  const date = toDate(value);
  return date ? date.toLocaleTimeString("en-US") : EMPTY;
}

export function formatMonthDay(value: unknown): string {
  const date = toDate(value);
  return date ? date.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : EMPTY;
}

export function formatMonthDayYear(value: unknown): string {
  const date = toDate(value);
  return date
    ? date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })
    : EMPTY;
}

export function formatCurrency(value: number, currency = "USD"): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return EMPTY;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(value);
}
