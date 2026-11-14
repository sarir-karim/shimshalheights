import { env } from "../config/env.js";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export function isISODate(value) {
  if (typeof value !== "string" || !ISO.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** Today's calendar date in the hotel's timezone, as YYYY-MM-DD. */
export function todayInHotelTz(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: env.HOTEL_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export const toUTCDate = (iso) => new Date(`${iso}T00:00:00Z`);
export const toISODate = (date) => date.toISOString().slice(0, 10);

/** The nights occupied by a stay: check-in date up to, but excluding, the check-out date. */
export function nightsList(checkIn, checkOut) {
  const out = [];
  for (let t = toUTCDate(checkIn).getTime(), end = toUTCDate(checkOut).getTime(); t < end; t += 86_400_000) {
    out.push(new Date(t).toISOString().slice(0, 10));
  }
  return out;
}
