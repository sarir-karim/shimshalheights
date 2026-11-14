import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

/**
 * Email integration point. No provider is wired yet: messages are logged so the flow is visible in development.
 * To go live, implement `deliver` with Nodemailer/SendGrid/Resend; nothing else in the app needs to change.
 */
export const emailService = {
  async deliver({ to, subject, text }) {
    logger.info(`[email:not-sent] to=${to} subject="${subject}"\n${text}`);
  },

  async send(message) {
    try {
      await this.deliver(message);
    } catch (err) {
      logger.error("Email delivery failed:", err.message); // never break a booking because email failed
    }
  },

  bookingReceivedForGuest(b) {
    return {
      to: b.guestEmail,
      subject: `Booking request received (${b.bookingReference})`,
      text: `Hello ${b.guestName},\n\nWe received your request for ${b.roomName}, ${b.numberOfNights} night(s). It is pending until the hotel confirms availability. Reference: ${b.bookingReference}.`,
    };
  },

  newBookingForAdmin(b) {
    return {
      to: env.ADMIN_NOTIFY_EMAIL,
      subject: `New booking request ${b.bookingReference}`,
      text: `${b.guestName} requested ${b.numberOfRooms} x ${b.roomName} for ${b.numberOfNights} night(s). Total ${b.totalPrice}.`,
    };
  },
};
