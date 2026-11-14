import { z } from "zod";
import { todayISO } from "@/lib/utils";
import type { Room } from "@/types";

/** Shared validation for every booking form. The backend (Step 4) re-validates with equivalent Zod schemas. */
const stayShape = {
  checkIn: z.string().min(1, "Choose a check-in date"),
  checkOut: z.string().min(1, "Choose a check-out date"),
  adults: z.coerce.number({ error: "Enter number of adults" }).int().min(1, "At least 1 adult").max(12, "Maximum 12 adults"),
  children: z.coerce.number({ error: "Enter number of children" }).int().min(0, "Cannot be negative").max(12, "Maximum 12 children"),
  rooms: z.coerce.number({ error: "Enter number of rooms" }).int().min(1, "At least 1 room").max(10, "Maximum 10 rooms"),
};

const guestShape = {
  guestName: z.string().trim().min(2, "Enter your full name").max(80, "Name is too long"),
  guestEmail: z.string().trim().email("Enter a valid email address"),
  guestPhone: z.string().trim().regex(/^[+()\d\s-]{7,20}$/, "Enter a valid phone number, e.g. +92 300 1234567"),
  specialRequests: z.string().max(500, "Keep special requests under 500 characters").optional(),
};

function checkDates(v: { checkIn: string; checkOut: string }, ctx: z.RefinementCtx) {
  if (v.checkIn && v.checkIn < todayISO()) {
    ctx.addIssue({ code: "custom", path: ["checkIn"], message: "Check-in cannot be in the past" });
  }
  if (v.checkIn && v.checkOut && v.checkOut <= v.checkIn) {
    ctx.addIssue({ code: "custom", path: ["checkOut"], message: "Check-out must be after check-in" });
  }
}

export const staySchema = z.object(stayShape).superRefine(checkDates);
export const guestSchema = z.object(guestShape);
export const bookingSchema = z
  .object({ ...stayShape, ...guestShape, roomSlug: z.string().min(1, "Choose a room") })
  .superRefine(checkDates);

export type StayValues = z.input<typeof staySchema>;
export type GuestValues = z.input<typeof guestSchema>;
export type BookingValues = z.input<typeof bookingSchema>;

/** Returns a user-facing message when the party does not fit the room, otherwise null. */
export function capacityIssue(room: Room, party: { adults: number; children: number; rooms: number }) {
  const { adults, children, rooms } = party;
  if (rooms > room.totalRooms) return `We only have ${room.totalRooms} ${room.name}${room.totalRooms > 1 ? "s" : ""}. Reduce the number of rooms.`;
  if (adults > room.maxAdults * rooms) return `${room.name} fits up to ${room.maxAdults} adult${room.maxAdults > 1 ? "s" : ""} per room. Add rooms or choose a larger room.`;
  if (children > room.maxChildren * rooms) return `${room.name} fits up to ${room.maxChildren} child${room.maxChildren === 1 ? "" : "ren"} per room. Add rooms or choose a larger room.`;
  return null;
}

export function estimateTotal(room: Room, nights: number, rooms: number) {
  return room.pricePerNight * nights * Math.max(rooms, 1);
}

export function formatDate(iso: string) {
  if (!iso) return "";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}
