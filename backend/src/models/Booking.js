import mongoose from "mongoose";

export const BOOKING_STATUSES = ["pending", "confirmed", "rejected", "cancelled", "completed"];
/** Only these statuses hold room inventory. */
export const ACTIVE_STATUSES = ["pending", "confirmed"];
export const PAYMENT_STATUSES = ["unpaid", "paid", "refunded"];

const historySchema = new mongoose.Schema(
  {
    status: { type: String, enum: BOOKING_STATUSES, required: true },
    at: { type: Date, default: Date.now },
    by: { type: String, default: "guest" }, // "guest" or the admin/staff user id
    note: { type: String, default: "", maxlength: 500 },
  },
  { _id: false },
);

const bookingSchema = new mongoose.Schema(
  {
    bookingReference: { type: String, required: true, unique: true },
    guestName: { type: String, required: true, trim: true, maxlength: 80 },
    guestEmail: { type: String, required: true, trim: true, lowercase: true },
    guestPhone: { type: String, required: true, trim: true, maxlength: 30 },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    roomName: { type: String, required: true }, // snapshot, survives later renames
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    numberOfAdults: { type: Number, required: true, min: 1 },
    numberOfChildren: { type: Number, default: 0, min: 0 },
    numberOfRooms: { type: Number, required: true, min: 1 },
    numberOfNights: { type: Number, required: true, min: 1 },
    pricePerNight: { type: Number, required: true, min: 0 }, // snapshot at booking time
    totalPrice: { type: Number, required: true, min: 0 },
    specialRequests: { type: String, default: "", maxlength: 500 },
    status: { type: String, enum: BOOKING_STATUSES, default: "pending" },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: "unpaid" },
    statusHistory: { type: [historySchema], default: [] },
  },
  { timestamps: true },
);

// Supports the standard overlap query: checkIn < requestedCheckOut AND checkOut > requestedCheckIn
bookingSchema.index({ room: 1, status: 1, checkIn: 1, checkOut: 1 });
bookingSchema.index({ status: 1, checkIn: 1 });
bookingSchema.index({ guestEmail: 1 });
bookingSchema.index({ createdAt: -1 });

export const Booking = mongoose.model("Booking", bookingSchema);
