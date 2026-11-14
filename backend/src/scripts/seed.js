import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../config/db.js";
import { env } from "../config/env.js";
import "../models/index.js";
import { Restaurant, Room, Settings, User } from "../models/index.js";

/**
 * npm run seed            creates the first admin (ADMIN_EMAIL / ADMIN_PASSWORD) and empty settings
 * npm run seed -- --demo  also adds DEMO rooms and restaurant info. Prices and text are placeholders.
 */
await connectDB();
await Promise.all(Object.values(mongoose.models).map((m) => m.init()));

if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD || env.ADMIN_PASSWORD.length < 10) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 10 characters) in .env first.");
  process.exit(1);
}
const email = env.ADMIN_EMAIL.toLowerCase();
if (await User.exists({ email })) console.log(`Admin ${email} already exists, left unchanged.`);
else {
  await User.create({ name: env.ADMIN_NAME, email, password: env.ADMIN_PASSWORD, role: "admin" });
  console.log(`Created admin ${email}`);
}
await Settings.findOneAndUpdate({ key: "main" }, { $setOnInsert: { key: "main" } }, { upsert: true });

if (process.argv.includes("--demo")) {
  const rooms = [
    ["Mountain Standard Room", "mountain-standard-room", "standard", 8000, 2, 1, 6, "1 double bed", true],
    ["Deluxe Valley Room", "deluxe-valley-room", "deluxe", 11000, 2, 2, 4, "1 king bed", true],
    ["Family Room", "family-room", "family", 14000, 4, 2, 3, "2 double beds", true],
    ["Heights Suite", "heights-suite", "suite", 18000, 3, 1, 1, "1 king bed + sofa bed", false],
  ];
  for (const [name, slug, roomType, pricePerNight, maxAdults, maxChildren, totalRooms, bedConfiguration, featured] of rooms) {
    await Room.updateOne(
      { slug },
      { $setOnInsert: { name, slug, roomType, pricePerNight, maxAdults, maxChildren, totalRooms, bedConfiguration, featured, description: `DEMO: ${name}. Replace with the real description.`, shortDescription: `DEMO: ${name}`, amenities: ["Private bathroom", "Heating", "Room service"], isActive: true } },
      { upsert: true },
    );
  }
  if (!(await Restaurant.exists({}))) {
    await Restaurant.create({
      description: "DEMO: restaurant description.",
      openingHours: [{ label: "Breakfast", hours: "07:00 to 10:00" }, { label: "Dinner", hours: "18:30 to 21:30" }],
      menuCategories: ["Breakfast", "Mains", "Soups & Sides", "Hot Drinks"].map((name, order) => ({ name, order })),
    });
  }
  console.log("Demo rooms and restaurant added (placeholder data).");
}
await disconnectDB();
