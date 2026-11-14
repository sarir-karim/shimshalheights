import { useMockData } from "@/config/site";
import { api, ApiError } from "@/lib/adminApi";
import { capacityIssue, estimateTotal } from "@/lib/booking";
import { mapRoom } from "@/lib/mappers";
import { nightsBetween } from "@/lib/utils";
import { mockGetRooms } from "@/services/mockData";
import type { AdminRoom } from "@/types/admin";
import type { Room } from "@/types";

export interface AvailabilityQuery { checkIn: string; checkOut: string; adults: number; children: number; rooms: number }
export interface AvailabilityResult { room: Room; availableUnits: number; nights: number; estimatedTotal: number }
export interface BookingRequestPayload extends AvailabilityQuery {
  roomSlug: string; guestName: string; guestEmail: string; guestPhone: string; specialRequests?: string;
}
export interface BookingRequestReceipt { reference: string; status: "pending"; submittedAt: string }

/**
 * Talks to the Express API through the site's own /api proxy. The server alone decides availability and price;
 * a request always comes back as "pending" until hotel staff confirm it.
 */
export async function checkAvailability(query: AvailabilityQuery): Promise<AvailabilityResult[]> {
  if (useMockData) {
    const nights = nightsBetween(query.checkIn, query.checkOut);
    if (nights < 1) return [];
    return (await mockGetRooms()).filter((r) => capacityIssue(r, query) === null).map((room) => ({ room, availableUnits: room.totalRooms, nights, estimatedTotal: estimateTotal(room, nights, query.rooms) }));
  }
  const res = await api<{ room: AdminRoom; availableUnits: number; nights: number; estimatedTotal: number }[]>("GET", "/bookings/availability", { query: { ...query } });
  return res.data.map((a) => ({ room: mapRoom(a.room), availableUnits: a.availableUnits, nights: a.nights, estimatedTotal: a.estimatedTotal }));
}

export async function submitBookingRequest(payload: BookingRequestPayload): Promise<BookingRequestReceipt> {
  if (useMockData) {
    await new Promise((r) => setTimeout(r, 600));
    return { reference: `SH-DEMO-${Math.random().toString(36).slice(2, 7).toUpperCase()}`, status: "pending", submittedAt: new Date().toISOString() };
  }
  const res = await api<{ reference: string; status: "pending"; submittedAt: string }>("POST", "/bookings", { body: payload });
  return { reference: res.data.reference, status: "pending", submittedAt: res.data.submittedAt };
}

/** Turns an API failure into a sentence a guest can act on. */
export function bookingErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 409) return "Sorry, that room is no longer available for those dates. Please choose different dates or another room.";
    if (err.status === 429) return "Too many requests from this connection. Please wait a little and try again, or contact us on WhatsApp.";
    if (err.status === 0) return "We could not reach the booking system. Check your connection and try again.";
    if (err.status >= 400 && err.status < 500) return err.message;
  }
  return "We could not send your request. Please try again, or contact us directly.";
}
