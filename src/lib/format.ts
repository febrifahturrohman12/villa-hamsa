export const APP_TIMEZONE = process.env.NEXT_PUBLIC_APP_TIMEZONE || "Asia/Jakarta";

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: APP_TIMEZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export function formatDateShort(iso: string | null | undefined): string {
  if (!iso) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: APP_TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

/** Ubah nilai datetime-local (waktu setempat app) menjadi ISO UTC. */
export function localInputToIso(local: string, timeZone = APP_TIMEZONE): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(local);
  if (!m) return null;
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  const asUtc = Date.UTC(y, mo - 1, d, h, mi);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).formatToParts(new Date(asUtc));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const wall = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
  const date = new Date(asUtc - (wall - asUtc));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
