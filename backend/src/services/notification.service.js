import { env } from "../config/env.js";
import { Notification } from "../models/Notification.js";
import { logger } from "../utils/logger.js";
import { emailService } from "./email.service.js";

/** Best-effort side effects: a failure here must never fail the booking or message that triggered it. */
export async function notifyNewBooking(booking) {
  try {
    await Notification.create({
      type: "booking",
      title: `New booking request ${booking.bookingReference}`,
      message: `${booking.guestName}: ${booking.numberOfRooms} x ${booking.roomName}, ${booking.numberOfNights} night(s)`,
      refId: booking._id,
    });
    await emailService.send(emailService.bookingReceivedForGuest(booking));
    if (env.ADMIN_NOTIFY_EMAIL) await emailService.send(emailService.newBookingForAdmin(booking));
  } catch (err) {
    logger.error("notifyNewBooking failed:", err.message);
  }
}

export async function notifyNewContactMessage(message) {
  try {
    await Notification.create({ type: "contact", title: `New message: ${message.subject}`, message: `${message.name} <${message.email}>`, refId: message._id });
  } catch (err) {
    logger.error("notifyNewContactMessage failed:", err.message);
  }
}
