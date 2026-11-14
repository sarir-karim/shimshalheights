import { Booking } from "../models/Booking.js";
import { ok } from "../utils/apiResponse.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { toISODate, toUTCDate } from "../utils/dates.js";
import { pageMeta, paginate } from "../utils/pagination.js";
import { toClient } from "../utils/serialize.js";
import { getAvailability } from "../services/availability.service.js";
import { changeBookingStatus, changePaymentStatus, createBooking } from "../services/booking.service.js";

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const SORTS = { newest: { createdAt: -1 }, oldest: { createdAt: 1 }, "checkin-asc": { checkIn: 1 }, "checkin-desc": { checkIn: -1 } };

export const create = asyncHandler(async (req, res) => {
  const b = await createBooking(req.valid.body);
  // Guests get a minimal receipt. The booking stays PENDING until staff confirm it.
  ok(res, {
    reference: b.bookingReference,
    status: b.status,
    submittedAt: b.createdAt,
    summary: { roomName: b.roomName, checkIn: toISODate(b.checkIn), checkOut: toISODate(b.checkOut), nights: b.numberOfNights, rooms: b.numberOfRooms, totalPrice: b.totalPrice },
  }, { status: 201 });
});

export const availability = asyncHandler(async (req, res) => {
  const q = req.valid.query;
  const results = await getAvailability(q);
  ok(res, toClient(results), { meta: { checkIn: q.checkIn, checkOut: q.checkOut } });
});

export const list = asyncHandler(async (req, res) => {
  const q = req.valid.query;
  const filter = {};
  if (q.status) filter.status = q.status;
  if (q.paymentStatus) filter.paymentStatus = q.paymentStatus;
  if (q.from || q.to) filter.checkIn = { ...(q.from && { $gte: toUTCDate(q.from) }), ...(q.to && { $lte: toUTCDate(q.to) }) };
  if (q.q) filter.$or = [{ bookingReference: q.q.toUpperCase() }, { guestName: new RegExp(escapeRegex(q.q), "i") }];
  const p = paginate(q);
  const [items, total] = await Promise.all([
    Booking.find(filter).sort(SORTS[q.sort]).skip(p.skip).limit(p.limit).lean(),
    Booking.countDocuments(filter),
  ]);
  ok(res, toClient(items), { meta: pageMeta(p, total) });
});

export const getOne = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.valid.params.id).populate("room", "name slug").lean();
  if (!booking) throw AppError.notFound("Booking not found");
  ok(res, toClient(booking));
});

export const updateStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.valid.body;
  ok(res, toClient(await changeBookingStatus(req.valid.params.id, status, req.user, note)));
});

export const updatePayment = asyncHandler(async (req, res) => {
  ok(res, toClient(await changePaymentStatus(req.valid.params.id, req.valid.body.paymentStatus)));
});
