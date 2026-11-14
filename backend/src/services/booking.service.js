import { Booking, ACTIVE_STATUSES } from "../models/Booking.js";
import { Room } from "../models/Room.js";
import { AppError } from "../utils/AppError.js";
import { nightsList, todayInHotelTz, toISODate, toUTCDate } from "../utils/dates.js";
import { generateBookingReference } from "../utils/bookingReference.js";
import { logger } from "../utils/logger.js";
import { partyIssue, releaseInventory, reserveInventory } from "./availability.service.js";
import { notifyNewBooking } from "./notification.service.js";

export const MAX_NIGHTS = 30;

/** Allowed status moves. rejected, cancelled and completed are final. */
export const TRANSITIONS = {
  pending: ["confirmed", "rejected", "cancelled"],
  confirmed: ["cancelled", "completed"],
  rejected: [],
  cancelled: [],
  completed: [],
};
const RELEASES_INVENTORY = new Set(["rejected", "cancelled", "completed"]);

function assertValidStay({ checkIn, checkOut }) {
  if (checkIn < todayInHotelTz()) throw new AppError("Check-in date cannot be in the past", 422, "INVALID_DATES");
  if (checkOut <= checkIn) throw new AppError("Check-out must be after check-in", 422, "INVALID_DATES");
  if (nightsList(checkIn, checkOut).length > MAX_NIGHTS) throw new AppError(`Stays are limited to ${MAX_NIGHTS} nights. Please contact the hotel for longer stays.`, 422, "INVALID_DATES");
}

/**
 * Creates a PENDING booking request. The server alone decides availability and price:
 * 1. load the room and recompute the price (client-supplied prices are never trusted)
 * 2. atomically reserve every night (fails with 409 if the room is full on any night)
 * 3. save the booking; if saving fails, give the nights back
 */
export async function createBooking(input) {
  assertValidStay(input);
  const room = await Room.findOne({ slug: input.roomSlug, isActive: true });
  if (!room) throw AppError.notFound("Room not found");

  const issue = partyIssue(room, { adults: input.adults, children: input.children, rooms: input.rooms });
  if (issue) throw new AppError(issue, 422, "CAPACITY_EXCEEDED");

  const nights = nightsList(input.checkIn, input.checkOut);
  const reserved = await reserveInventory(room._id, nights, input.rooms, room.totalRooms);
  if (!reserved) throw AppError.conflict("Sorry, this room is no longer available for the selected dates.", "NOT_AVAILABLE");

  try {
    let booking;
    for (let attempt = 0; attempt < 5 && !booking; attempt += 1) {
      try {
        // eslint-disable-next-line no-await-in-loop
        booking = await Booking.create({
          bookingReference: generateBookingReference(),
          guestName: input.guestName,
          guestEmail: input.guestEmail,
          guestPhone: input.guestPhone,
          room: room._id,
          roomName: room.name,
          checkIn: toUTCDate(input.checkIn),
          checkOut: toUTCDate(input.checkOut),
          numberOfAdults: input.adults,
          numberOfChildren: input.children,
          numberOfRooms: input.rooms,
          numberOfNights: nights.length,
          pricePerNight: room.pricePerNight,
          totalPrice: room.pricePerNight * nights.length * input.rooms,
          specialRequests: input.specialRequests ?? "",
          status: "pending",
          statusHistory: [{ status: "pending", by: "guest", note: "Booking request received" }],
        });
      } catch (err) {
        if (!(err.code === 11000 && err.keyPattern?.bookingReference)) throw err; // reference collision: retry with a new one
      }
    }
    if (!booking) throw new Error("Could not generate a unique booking reference");
    notifyNewBooking(booking); // fire-and-forget, never blocks or fails the request
    return booking;
  } catch (err) {
    await releaseInventory(room._id, nights, input.rooms).catch((e) => logger.error("Inventory rollback failed:", e.message));
    throw err;
  }
}

/** Moves a booking to a new status. The conditional update means two admins acting at once cannot both win. */
export async function changeBookingStatus(id, newStatus, actor, note = "") {
  const booking = await Booking.findById(id);
  if (!booking) throw AppError.notFound("Booking not found");
  if (!TRANSITIONS[booking.status].includes(newStatus)) {
    throw AppError.conflict(`A ${booking.status} booking cannot be changed to ${newStatus}`, "INVALID_TRANSITION");
  }

  const updated = await Booking.findOneAndUpdate(
    { _id: id, status: booking.status },
    { $set: { status: newStatus }, $push: { statusHistory: { status: newStatus, by: String(actor.id), note } } },
    { returnDocument: "after" },
  );
  if (!updated) throw AppError.conflict("This booking was just changed by someone else. Refresh and try again.", "STALE_STATUS");

  if (ACTIVE_STATUSES.includes(booking.status) && RELEASES_INVENTORY.has(newStatus)) {
    const nights = nightsList(toISODate(updated.checkIn), toISODate(updated.checkOut));
    await releaseInventory(updated.room, nights, updated.numberOfRooms);
  }
  return updated;
}

export async function changePaymentStatus(id, paymentStatus) {
  const booking = await Booking.findById(id);
  if (!booking) throw AppError.notFound("Booking not found");
  if (paymentStatus === booking.paymentStatus) return booking;
  if (paymentStatus === "refunded" && booking.paymentStatus !== "paid") throw AppError.conflict("Only a paid booking can be refunded", "INVALID_PAYMENT");
  if (paymentStatus === "paid" && ["rejected", "cancelled"].includes(booking.status)) throw AppError.conflict("Cannot take payment for a rejected or cancelled booking", "INVALID_PAYMENT");
  booking.paymentStatus = paymentStatus;
  await booking.save();
  return booking;
}
