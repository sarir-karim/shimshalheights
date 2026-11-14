import mongoose from "mongoose";

/**
 * Per-room, per-night count of reserved units. This is the concurrency guard for bookings:
 * reserving a night is a single atomic conditional update (`reserved <= totalRooms - qty` then `$inc`),
 * so two simultaneous requests can never push `reserved` past the room's inventory.
 * It is derived data: `npm run rebuild-inventory` recomputes it from active bookings.
 */
const inventoryNightSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
  date: { type: String, required: true }, // YYYY-MM-DD, hotel-local calendar night
  reserved: { type: Number, default: 0, min: 0 },
});

inventoryNightSchema.index({ room: 1, date: 1 }, { unique: true });

export const InventoryNight = mongoose.model("InventoryNight", inventoryNightSchema);
