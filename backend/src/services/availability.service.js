import { Booking, ACTIVE_STATUSES } from "../models/Booking.js";
import { InventoryNight } from "../models/InventoryNight.js";
import { Room } from "../models/Room.js";
import { nightsList, toISODate, toUTCDate } from "../utils/dates.js";

/** Server-side party check. Returns a message when the party does not fit, otherwise null. */
export function partyIssue(room, { adults, children, rooms }) {
  if (rooms > room.totalRooms) return `Only ${room.totalRooms} of this room type exist`;
  if (adults > room.maxAdults * rooms) return `This room fits at most ${room.maxAdults} adult(s) per room`;
  if (children > room.maxChildren * rooms) return `This room fits at most ${room.maxChildren} child(ren) per room`;
  return null;
}

/**
 * READ MODEL. Finds active bookings that overlap the requested stay using the standard overlap condition
 *   existingCheckIn < requestedCheckOut  AND  existingCheckOut > requestedCheckIn
 * then counts occupied units night by night. Counting per night (not summing all overlapping bookings)
 * is exact: two bookings that overlap the request but not each other never double-count.
 * Only pending and confirmed bookings hold inventory.
 */
export async function getAvailability({ checkIn, checkOut, adults, children, rooms: roomsWanted, roomSlug }) {
  const nights = nightsList(checkIn, checkOut);
  const nightSet = new Set(nights);

  const roomDocs = await Room.find({ isActive: true, ...(roomSlug ? { slug: roomSlug } : {}) }).lean();
  if (roomDocs.length === 0) return [];

  const overlapping = await Booking.find({
    room: { $in: roomDocs.map((r) => r._id) },
    status: { $in: ACTIVE_STATUSES },
    checkIn: { $lt: toUTCDate(checkOut) },
    checkOut: { $gt: toUTCDate(checkIn) },
  })
    .select("room checkIn checkOut numberOfRooms")
    .lean();

  const usage = new Map(); // roomId -> Map(date -> units)
  for (const b of overlapping) {
    const key = String(b.room);
    if (!usage.has(key)) usage.set(key, new Map());
    const perNight = usage.get(key);
    for (const date of nightsList(toISODate(b.checkIn), toISODate(b.checkOut))) {
      if (nightSet.has(date)) perNight.set(date, (perNight.get(date) ?? 0) + b.numberOfRooms);
    }
  }

  return roomDocs
    .map((room) => {
      const peak = Math.max(0, ...(usage.get(String(room._id))?.values() ?? []));
      return { room, availableUnits: room.totalRooms - peak, nights: nights.length, estimatedTotal: room.pricePerNight * nights.length * roomsWanted };
    })
    .filter((r) => r.availableUnits >= roomsWanted && partyIssue(r.room, { adults, children, rooms: roomsWanted }) === null);
}

/** One atomic conditional update: succeeds only if `qty` more units still fit on that night. */
async function reserveNight(roomId, date, qty, totalRooms) {
  const limit = totalRooms - qty;
  if (limit < 0) return false;
  const filter = { room: roomId, date, reserved: { $lte: limit } };
  const update = { $inc: { reserved: qty } };
  try {
    return Boolean(await InventoryNight.findOneAndUpdate(filter, update, { upsert: true, returnDocument: "after" }));
  } catch (err) {
    if (err.code !== 11000) throw err;
    // Duplicate key: the night row exists (created concurrently, or already full).
    // Retry without upsert: it applies if capacity remains, and returns null if the night is full.
    return Boolean(await InventoryNight.findOneAndUpdate(filter, update, { returnDocument: "after" }));
  }
}

export async function releaseInventory(roomId, nights, qty) {
  if (nights.length === 0) return;
  await InventoryNight.bulkWrite(
    nights.map((date) => ({
      updateOne: { filter: { room: roomId, date, reserved: { $gte: qty } }, update: { $inc: { reserved: -qty } } },
    })),
  );
}

/**
 * WRITE GUARD. Reserves every night of the stay or none of them: if any night is full, the nights already
 * reserved are released again. Because each night is reserved with an atomic conditional update, concurrent
 * requests can never exceed `totalRooms`, with or without multi-document transactions.
 */
export async function reserveInventory(roomId, nights, qty, totalRooms) {
  const done = [];
  try {
    for (const date of nights) {
      // eslint-disable-next-line no-await-in-loop
      if (!(await reserveNight(roomId, date, qty, totalRooms))) {
        await releaseInventory(roomId, done, qty);
        return false;
      }
      done.push(date);
    }
    return true;
  } catch (err) {
    await releaseInventory(roomId, done, qty);
    throw err;
  }
}

/** Recomputes the inventory ledger from active bookings (repair tool after crashes or manual DB edits). */
export async function rebuildInventory() {
  const active = await Booking.find({ status: { $in: ACTIVE_STATUSES } }).select("room checkIn checkOut numberOfRooms").lean();
  const counts = new Map();
  for (const b of active) {
    for (const date of nightsList(toISODate(b.checkIn), toISODate(b.checkOut))) {
      const key = `${b.room}|${date}`;
      counts.set(key, (counts.get(key) ?? 0) + b.numberOfRooms);
    }
  }
  await InventoryNight.deleteMany({});
  const docs = [...counts].map(([key, reserved]) => {
    const [room, date] = key.split("|");
    return { room, date, reserved };
  });
  if (docs.length) await InventoryNight.insertMany(docs);
  return docs.length;
}
