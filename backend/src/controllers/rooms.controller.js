import { Booking, ACTIVE_STATUSES } from "../models/Booking.js";
import { InventoryNight } from "../models/InventoryNight.js";
import { Room } from "../models/Room.js";
import { AppError } from "../utils/AppError.js";
import { assertSomethingToUpdate } from "../utils/assertUpdate.js";
import { ok } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { todayInHotelTz, toUTCDate } from "../utils/dates.js";
import { pageMeta, paginate } from "../utils/pagination.js";
import { toClient } from "../utils/serialize.js";
import { uniqueSlug } from "../utils/slugify.js";
import { FOLDERS, uploadService } from "../services/upload.service.js";

const SORTS = { "price-asc": { pricePerNight: 1 }, "price-desc": { pricePerNight: -1 }, capacity: { maxAdults: -1, maxChildren: -1 }, newest: { createdAt: -1 } };

export const listRooms = asyncHandler(async (req, res) => {
  const q = req.valid.query;
  const filter = {};
  if (!(q.all && req.user)) filter.isActive = true; // inactive rooms are only visible to signed-in staff
  if (q.roomType) filter.roomType = q.roomType;
  if (q.featured !== undefined) filter.featured = q.featured;
  if (q.minPrice !== undefined || q.maxPrice !== undefined) {
    filter.pricePerNight = { ...(q.minPrice !== undefined && { $gte: q.minPrice }), ...(q.maxPrice !== undefined && { $lte: q.maxPrice }) };
  }
  const p = paginate(q);
  let rooms = await Room.find(filter).sort(SORTS[q.sort]).lean();
  if (q.guests) rooms = rooms.filter((r) => r.maxAdults + r.maxChildren >= q.guests);
  const total = rooms.length;
  ok(res, toClient(rooms.slice(p.skip, p.skip + p.limit)), { meta: pageMeta(p, total) });
});

export const getRoom = asyncHandler(async (req, res) => {
  const room = await Room.findOne({ slug: req.valid.params.slug, ...(req.user ? {} : { isActive: true }) }).lean();
  if (!room) throw AppError.notFound("Room not found");
  ok(res, toClient(room));
});

export const createRoom = asyncHandler(async (req, res) => {
  const data = req.valid.body;
  const files = req.files ?? [];
  const uploaded = files.length ? await uploadService.uploadMany(files, FOLDERS.rooms) : [];
  try {
    const room = await Room.create({
      ...data,
      slug: await uniqueSlug(Room, data.name),
      images: uploaded.map((u) => ({ ...u, alt: data.name })),
    });
    ok(res, toClient(room), { status: 201 });
  } catch (err) {
    await uploadService.destroyMany(uploaded.map((u) => u.publicId));
    throw err;
  }
});

export const updateRoom = asyncHandler(async (req, res) => {
  assertSomethingToUpdate(req);
  const room = await Room.findById(req.valid.params.id);
  if (!room) throw AppError.notFound("Room not found");
  const { removeImages = [], slug, ...fields } = req.valid.body;

  // Never shrink inventory below what is already reserved for today or later.
  if (fields.totalRooms !== undefined && fields.totalRooms < room.totalRooms) {
    const over = await InventoryNight.exists({ room: room._id, date: { $gte: todayInHotelTz() }, reserved: { $gt: fields.totalRooms } });
    if (over) throw AppError.conflict("Existing bookings need more rooms than that. Cancel or move them first.", "INVENTORY_IN_USE");
  }
  if (slug && slug !== room.slug) {
    if (await Room.exists({ slug, _id: { $ne: room._id } })) throw AppError.conflict("That slug is already used by another room", "DUPLICATE");
    room.slug = slug;
  }

  const files = req.files ?? [];
  const uploaded = files.length ? await uploadService.uploadMany(files, FOLDERS.rooms) : [];
  const toDelete = room.images.filter((img) => removeImages.includes(img.publicId)).map((img) => img.publicId);
  try {
    room.set(fields);
    room.images = [...room.images.filter((img) => !toDelete.includes(img.publicId)), ...uploaded.map((u) => ({ ...u, alt: room.name }))];
    await room.save();
  } catch (err) {
    await uploadService.destroyMany(uploaded.map((u) => u.publicId));
    throw err;
  }
  await uploadService.destroyMany(toDelete); // only after the DB save succeeded
  ok(res, toClient(room));
});

export const deleteRoom = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.valid.params.id);
  if (!room) throw AppError.notFound("Room not found");
  const hasUpcoming = await Booking.exists({ room: room._id, status: { $in: ACTIVE_STATUSES }, checkOut: { $gt: toUTCDate(todayInHotelTz()) } });
  if (hasUpcoming) throw AppError.conflict("This room has pending or confirmed bookings. Deactivate it instead, or resolve the bookings first.", "ROOM_HAS_BOOKINGS");
  await room.deleteOne();
  await InventoryNight.deleteMany({ room: room._id });
  await uploadService.destroyMany(room.images.map((i) => i.publicId));
  ok(res, { deleted: true });
});
