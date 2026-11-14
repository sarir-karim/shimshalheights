import { connectDB, disconnectDB } from "../config/db.js";
import "../models/index.js";
import { rebuildInventory } from "../services/availability.service.js";

await connectDB();
const nights = await rebuildInventory();
console.log(`Inventory rebuilt from active bookings (${nights} reserved room-nights).`);
await disconnectDB();
