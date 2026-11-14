// Dev/E2E harness: runs the real API against a real MongoDB with Cloudinary replaced by in-memory fakes,
// and seeds sample data. Used only by the browser end-to-end checks, never in production.
process.env.NODE_ENV = "development";
process.env.PORT = "5055";
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/sh_e2e";
process.env.JWT_SECRET = "e2e-secret-e2e-secret-e2e-secret-0123456789";
process.env.CLIENT_ORIGINS = "http://localhost:3111";
process.env.RATE_LIMIT_ENABLED = "false";
process.env.FRONTEND_REVALIDATE_URL = "http://localhost:3111/revalidate";
process.env.REVALIDATE_SECRET = "e2e-revalidate-secret-123456";

const mongoose = (await import("mongoose")).default;
const { connectDB } = await import("../src/config/db.js");
await import("../src/models/index.js");
const { createApp } = await import("../src/app.js");
const { uploadService } = await import("../src/services/upload.service.js");
const { User, Room, Restaurant, Settings, Testimonial, ContactMessage, MenuItem, Gallery } = await import("../src/models/index.js");
const { createBooking, changeBookingStatus, changePaymentStatus } = await import("../src/services/booking.service.js");

await connectDB();
await mongoose.connection.dropDatabase();
await Promise.all(Object.values(mongoose.models).map((m) => m.init()));

let n = 0;
const colors = ["#1F3B2D", "#C9AE7C", "#6E7572", "#2F5642", "#A98B55"];
const fake = (folder) => {
  n += 1;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="${colors[n % 5]}"/><text x="20" y="40" fill="#fff" font-size="22">upload ${n}</text></svg>`;
  return { url: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`, publicId: `${folder}/e2e${n}` };
};
uploadService.assertConfigured = () => {};
uploadService.uploadBuffer = async (_b, folder) => fake(folder);
uploadService.uploadMany = async (files, folder) => files.map(() => fake(folder));
uploadService.destroy = async () => {};
uploadService.destroyMany = async () => {};

await User.create({ name: "Hotel Admin", email: "admin@example.com", password: "admin-password-123", role: "admin" });
await User.create({ name: "Front Desk", email: "staff@example.com", password: "staff-password-123", role: "staff" });
const mk = (name, slug, roomType, price, adults, kids, total, beds, featured) => Room.create({ name, slug, roomType, pricePerNight: price, maxAdults: adults, maxChildren: kids, totalRooms: total, bedConfiguration: beds, featured, description: `Demo description for ${name}.`, shortDescription: `Demo: ${name}`, amenities: ["Heating", "Mountain view"], images: [{ ...fake("shimshal-heights/rooms"), alt: name }] });
const standard = await mk("Mountain Standard Room", "mountain-standard-room", "standard", 8000, 2, 1, 6, "1 double bed", true);
await mk("Deluxe Valley Room", "deluxe-valley-room", "deluxe", 11000, 2, 2, 4, "1 king bed", true);
await mk("Family Room", "family-room", "family", 14000, 4, 2, 3, "2 double beds", false);
await mk("Heights Suite", "heights-suite", "suite", 18000, 3, 1, 1, "1 king bed", false);
const hotelRoom = await mk("Spare Room", "spare-room", "standard", 7000, 2, 0, 2, "1 double bed", false);
void hotelRoom;

const day = (off) => { const d = new Date(); d.setUTCDate(d.getUTCDate() + off); return d.toISOString().slice(0, 10); };
const book = (slug, off, nights, name, extra = {}) => createBooking({ roomSlug: slug, checkIn: day(off), checkOut: day(off + nights), adults: 2, children: 0, rooms: 1, guestName: name, guestEmail: `${name.split(" ")[0].toLowerCase()}@example.com`, guestPhone: "+92 300 1234567", ...extra });
const actor = { id: "seed" };
const b1 = await book("mountain-standard-room", 5, 3, "Alice Khan", { specialRequests: "Late arrival, around 11pm." });
const b2 = await book("deluxe-valley-room", 12, 2, "Bilal Shah");
const b3 = await book("family-room", 20, 4, "Carla Ruiz", { adults: 4, children: 2 });
const b4 = await book("mountain-standard-room", 30, 2, "Dawood Ali");
const b5 = await book("heights-suite", 40, 3, "Elena Petrova");
await book("mountain-standard-room", 50, 1, "Farah Noor");
await changeBookingStatus(b1.id, "confirmed", actor, "Confirmed by phone"); await changePaymentStatus(b1.id, "paid");
await changeBookingStatus(b2.id, "confirmed", actor); await changePaymentStatus(b2.id, "paid");
await changeBookingStatus(b3.id, "cancelled", actor, "Guest changed plans");
await changeBookingStatus(b4.id, "rejected", actor);
void b5;

await Testimonial.create({ guestName: "Sample Guest", guestLocation: "Demo", rating: 5, review: "Sample review for testing only.", isPublished: true, isFeatured: true });
await Testimonial.create({ guestName: "Draft Guest", guestLocation: "Demo", rating: 4, review: "An unpublished sample review.", isPublished: false });
await ContactMessage.create({ name: "Omar Farooq", email: "omar@example.com", phone: "+92 300 1112233", subject: "Trek dates in June", message: "Do you have rooms in June for a group of six trekkers?" });
await ContactMessage.create({ name: "Sara Iqbal", email: "sara@example.com", subject: "Parking for a van", message: "We arrive by van. Is there parking?" });
await ContactMessage.create({ name: "Old Enquiry", email: "old@example.com", subject: "Earlier question", message: "Already handled.", isRead: true, status: "replied" });
if (process.env.E2E_SEED === "minimal") {
  // Sparse data for the admin-panel checks (they start from an empty gallery and basic settings).
  await Restaurant.create({ description: "Demo restaurant.", openingHours: [{ label: "Dinner", hours: "18:30 to 21:30" }], menuCategories: [{ name: "Mains", order: 0 }, { name: "Drinks", order: 1 }] });
  await Settings.create({ key: "main", hotelName: "Shimshal Heights", checkInTime: "14:00", checkOutTime: "11:00" });
} else {
  // Realistic content for the public-site checks.
  const restaurant = await Restaurant.create({
    name: "Shimshal Heights Restaurant", description: "Warm meals served all day.",
    openingHours: [{ label: "Dinner", hours: "18:30 to 21:30" }], facilities: ["Indoor dining", "Room service"],
    images: [{ ...fake("shimshal-heights/restaurant"), alt: "Dining room" }],
    menuCategories: [{ name: "Mains", order: 0 }, { name: "Drinks", order: 1 }],
  });
  const [mains, drinks] = restaurant.menuCategories.map((c) => c._id);
  await MenuItem.create({ name: "Apricot Stew", description: "Slow cooked with local apricots.", category: mains, price: 1600, dietaryInformation: "non-vegetarian", image: { ...fake("shimshal-heights/menu"), alt: "Apricot Stew" } });
  await MenuItem.create({ name: "Vegetable Pulao", description: "Fragrant rice with seasonal vegetables.", category: mains, price: 1200, dietaryInformation: "vegetarian" });
  await MenuItem.create({ name: "Salt Tea", description: "Traditional pink tea.", category: drinks, price: 250, dietaryInformation: "vegetarian", isAvailable: false });
  for (const [title, category, isFeatured] of [["Ridge at dawn", "Mountains & Nature", true], ["Valley terraces", "Shimshal Valley", true], ["Hotel front", "Hotel Exterior", true], ["King room", "Rooms", true], ["Apricot stew", "Food", false], ["Dining room", "Restaurant", false]]) {
    const f = fake("shimshal-heights/gallery");
    await Gallery.create({ title, category, imageUrl: f.url, cloudinaryPublicId: f.publicId, isFeatured });
  }
  await Settings.create({
    key: "main", hotelName: "Shimshal Heights", description: "A mountain hotel in Shimshal Valley, Upper Hunza.", address: "Shimshal Valley, Upper Hunza, Gilgit-Baltistan, Pakistan",
    contactNumbers: ["+92 300 5550101"], email: "stay@shimshalheights.test", whatsappNumber: "923005550101",
    socialLinks: { facebook: "https://facebook.com/shimshalheights", instagram: "" }, checkInTime: "14:00", checkOutTime: "11:00",
    bookingPolicies: "Requests are confirmed by the hotel within one working day.", cancellationPolicies: "Free cancellation up to 7 days before arrival.",
    seo: { title: "Shimshal Heights | Mountain Hotel", description: "Rooms, restaurant and mountain views in Shimshal Valley." },
    googleMapsEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1000!2d74.0!3d36.4",
  });
}
void standard;

createApp().listen(5055, () => console.log("e2e API ready on 5055"));
