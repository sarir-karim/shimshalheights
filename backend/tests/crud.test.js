import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { addDays, bookingPayload, imageForm, loginCookie, makeRoom, makeUser, startTestServer, stubUploads, today } from "./helpers.js";

let t; let admin; let staff; let stub; let t0;
const roomFields = { name: "Valley Room", description: "A room", shortDescription: "Short", pricePerNight: 9000, roomType: "deluxe", maxAdults: 2, maxChildren: 1, totalRooms: 2, bedConfiguration: "1 king bed", amenities: ["Heating", "View"], featured: true };

before(async () => {
  t = await startTestServer("sh_crud");
  await makeUser("admin"); await makeUser("staff");
  admin = await loginCookie(t.api, "admin@example.com");
  staff = await loginCookie(t.api, "staff@example.com");
  stub = await stubUploads();
  t0 = await today();
});
after(async () => { stub.restore(); await t.stop(); });

describe("rooms", () => {
  let room;
  it("creates a room with multiple Cloudinary images (url + publicId stored, correct folder)", async () => {
    const res = await t.api("POST", "/rooms", { cookie: admin, form: imageForm(roomFields, "images", 2) });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    room = res.body.data;
    assert.equal(room.slug, "valley-room");
    assert.equal(room.images.length, 2);
    assert.ok(room.images.every((i) => i.url.startsWith("https://res.cloudinary.com/") && i.publicId.startsWith("shimshal-heights/rooms/")));
    assert.deepEqual(room.amenities, ["Heating", "View"]);
    assert.equal(room.featured, true);
  });
  it("gives duplicate names unique slugs", async () => {
    const res = await t.api("POST", "/rooms", { cookie: admin, form: imageForm(roomFields, "images", 0) });
    assert.equal(res.body.data.slug, "valley-room-2");
  });
  it("validates required fields and types", async () => {
    const res = await t.api("POST", "/rooms", { cookie: admin, body: { name: "x", pricePerNight: -5, roomType: "castle", maxAdults: 0 } });
    assert.equal(res.status, 422);
    assert.ok(res.body.errors.some((e) => e.field === "roomType"));
    assert.ok(res.body.errors.some((e) => e.field === "pricePerNight"));
  });
  it("is readable by slug and filters/sorts/paginates the list", async () => {
    await makeRoom({ name: "Cheap", slug: "cheap", pricePerNight: 3000, roomType: "standard", maxAdults: 1, maxChildren: 0 });
    await makeRoom({ name: "Big Family", slug: "big-family", pricePerNight: 20000, roomType: "family", maxAdults: 5, maxChildren: 3 });
    assert.equal((await t.api("GET", "/rooms/valley-room")).body.data.name, "Valley Room");
    const asc = (await t.api("GET", "/rooms?sort=price-asc")).body.data.map((r) => r.pricePerNight);
    assert.deepEqual(asc, [...asc].sort((a, b) => a - b));
    assert.equal((await t.api("GET", "/rooms?roomType=family")).body.data.length, 1);
    assert.ok((await t.api("GET", "/rooms?minPrice=5000&maxPrice=15000")).body.data.every((r) => r.pricePerNight >= 5000 && r.pricePerNight <= 15000));
    assert.ok((await t.api("GET", "/rooms?guests=7")).body.data.every((r) => r.maxAdults + r.maxChildren >= 7));
    const page = await t.api("GET", "/rooms?limit=2&page=2");
    assert.equal(page.body.meta.limit, 2); assert.equal(page.body.meta.page, 2); assert.ok(page.body.meta.total >= 4);
    assert.ok(page.body.data.every((r) => r.id && !r._id), "ids are exposed as `id`");
  });
  it("updates fields, adds an image and removes one (old image deleted from Cloudinary only after save)", async () => {
    const removeId = room.images[0].publicId;
    stub.log.destroyed.length = 0;
    const res = await t.api("PUT", `/rooms/${room.id}`, { cookie: admin, form: imageForm({ pricePerNight: "9500", removeImages: [removeId], featured: "false" }, "images", 1) });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.equal(res.body.data.pricePerNight, 9500);
    assert.equal(res.body.data.featured, false);
    assert.equal(res.body.data.images.length, 2);
    assert.ok(!res.body.data.images.some((i) => i.publicId === removeId));
    assert.deepEqual(stub.log.destroyed, [removeId]);
    room = res.body.data;
  });
  it("rejects an empty update", async () => {
    assert.equal((await t.api("PUT", `/rooms/${room.id}`, { cookie: admin, body: {} })).status, 422);
  });
  it("cannot shrink totalRooms below existing reservations", async () => {
    await t.api("POST", "/bookings", { body: bookingPayload("valley-room", await addDays(t0, 30), await addDays(t0, 32), { rooms: 2, adults: 4 }) });
    const res = await t.api("PUT", `/rooms/${room.id}`, { cookie: admin, body: { totalRooms: 1 } });
    assert.equal(res.status, 409); assert.equal(res.body.code, "INVENTORY_IN_USE");
  });
  it("cannot be deleted while it has upcoming pending/confirmed bookings; can be after they are cancelled; images are removed", async () => {
    assert.equal((await t.api("DELETE", `/rooms/${room.id}`, { cookie: admin })).body.code, "ROOM_HAS_BOOKINGS");
    const { Booking } = await import("../src/models/Booking.js");
    const bk = await Booking.findOne({ room: room.id });
    await t.api("PATCH", `/bookings/${bk.id}/status`, { cookie: admin, body: { status: "cancelled" } });
    stub.log.destroyed.length = 0;
    const del = await t.api("DELETE", `/rooms/${room.id}`, { cookie: admin });
    assert.equal(del.status, 200);
    assert.equal(stub.log.destroyed.length, 2);
    assert.equal((await t.api("GET", "/rooms/valley-room")).status, 404);
    const { InventoryNight } = await import("../src/models/InventoryNight.js");
    assert.equal(await InventoryNight.countDocuments({ room: room.id }), 0);
  });
  it("cleans up uploaded images if saving the room fails", async () => {
    const { Room } = await import("../src/models/Room.js");
    const orig = Room.create; Room.create = async () => { throw new Error("db down"); };
    stub.log.destroyed.length = 0; stub.log.uploaded.length = 0;
    try {
      const res = await t.api("POST", "/rooms", { cookie: admin, form: imageForm({ ...roomFields, name: "Fails" }, "images", 2) });
      assert.equal(res.status, 500);
      assert.equal(stub.log.uploaded.length, 2);
      assert.deepEqual([...stub.log.destroyed].sort(), [...stub.log.uploaded].sort(), "orphaned uploads must be deleted");
    } finally { Room.create = orig; }
  });
});

describe("gallery", () => {
  let items;
  it("uploads many images at once with titles, category and flags", async () => {
    const res = await t.api("POST", "/gallery", { cookie: admin, form: imageForm({ category: "Food", titles: ["Soup", "Bread"], isFeatured: "true" }, "images", 2) });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    items = res.body.data;
    assert.deepEqual(items.map((i) => i.title), ["Soup", "Bread"]);
    assert.ok(items.every((i) => i.category === "Food" && i.isFeatured && i.cloudinaryPublicId.startsWith("shimshal-heights/gallery/")));
  });
  it("requires at least one file and a valid category", async () => {
    assert.equal((await t.api("POST", "/gallery", { cookie: admin, form: imageForm({ category: "Food" }, "images", 0) })).status, 400);
    assert.equal((await t.api("POST", "/gallery", { cookie: admin, form: imageForm({ category: "Nonsense" }, "images", 1) })).status, 422);
  });
  it("filters by category and featured", async () => {
    await t.api("POST", "/gallery", { cookie: admin, form: imageForm({ category: "Rooms", title: "Suite" }, "images", 1) });
    assert.equal((await t.api("GET", "/gallery?category=Food")).body.data.length, 2);
    assert.equal((await t.api("GET", "/gallery?featured=true")).body.data.length, 2);
  });
  it("edits metadata, replaces the picture (deleting the old one), and deletes", async () => {
    const [a] = items;
    const meta = await t.api("PUT", `/gallery/${a.id}`, { cookie: admin, body: { title: "Hot soup", isFeatured: false } });
    assert.equal(meta.body.data.title, "Hot soup"); assert.equal(meta.body.data.isFeatured, false);
    stub.log.destroyed.length = 0;
    const rep = await t.api("PUT", `/gallery/${a.id}`, { cookie: admin, form: imageForm({}, "image", 1) });
    assert.equal(rep.status, 200);
    assert.notEqual(rep.body.data.cloudinaryPublicId, a.cloudinaryPublicId);
    assert.deepEqual(stub.log.destroyed, [a.cloudinaryPublicId]);
    stub.log.destroyed.length = 0;
    assert.equal((await t.api("DELETE", `/gallery/${a.id}`, { cookie: admin })).status, 200);
    assert.deepEqual(stub.log.destroyed, [rep.body.data.cloudinaryPublicId]);
    assert.equal((await t.api("DELETE", `/gallery/${a.id}`, { cookie: admin })).status, 404);
  });
});

describe("restaurant and menu", () => {
  let cats;
  it("public can read the restaurant; admin updates info, hours and categories", async () => {
    assert.equal((await t.api("GET", "/restaurant")).status, 200);
    const res = await t.api("PUT", "/restaurant", { cookie: admin, body: { description: "Warm food", openingHours: [{ label: "Dinner", hours: "18:00-21:00" }], menuCategories: [{ name: "Mains" }, { name: "Drinks" }] } });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    cats = res.body.data.menuCategories;
    assert.equal(cats.length, 2);
    assert.ok(cats.every((c) => c.id));
    assert.equal(res.body.data.openingHours[0].label, "Dinner");
  });
  it("manages restaurant photos (add, then remove)", async () => {
    const add = await t.api("PUT", "/restaurant", { cookie: admin, form: imageForm({ name: "Shimshal Heights Restaurant" }, "images", 2) });
    assert.equal(add.body.data.images.length, 2);
    stub.log.destroyed.length = 0;
    const rm = await t.api("PUT", "/restaurant", { cookie: admin, body: { removeImages: [add.body.data.images[0].publicId] } });
    assert.equal(rm.body.data.images.length, 1);
    assert.equal(stub.log.destroyed.length, 1);
  });
  it("creates menu items with an optional image and rejects unknown categories", async () => {
    const res = await t.api("POST", "/menu", { cookie: admin, form: imageForm({ name: "Soup", price: "700", category: cats[0].id, dietaryInformation: "vegetarian" }, "image", 1) });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    assert.ok(res.body.data.image.publicId.startsWith("shimshal-heights/menu/"));
    assert.equal(res.body.data.isAvailable, true);
    assert.equal((await t.api("POST", "/menu", { cookie: admin, body: { name: "X", price: 1, category: "64b000000000000000000000" } })).status, 400);
    assert.equal((await t.api("POST", "/menu", { cookie: admin, body: { name: "X", price: -1, category: cats[0].id } })).status, 422);
  });
  it("edits price/availability, replaces and removes the image, filters by category, deletes", async () => {
    const created = (await t.api("POST", "/menu", { cookie: admin, form: imageForm({ name: "Tea", price: "250", category: cats[1].id }, "image", 1) })).body.data;
    const upd = await t.api("PUT", `/menu/${created.id}`, { cookie: admin, body: { price: 300, isAvailable: false } });
    assert.equal(upd.body.data.price, 300); assert.equal(upd.body.data.isAvailable, false);
    stub.log.destroyed.length = 0;
    const noImg = await t.api("PUT", `/menu/${created.id}`, { cookie: admin, body: { removeImage: true } });
    assert.equal(noImg.body.data.image, undefined);
    assert.deepEqual(stub.log.destroyed, [created.image.publicId]);
    assert.equal((await t.api("GET", `/menu?category=${cats[1].id}`)).body.data.length, 1);
    assert.equal((await t.api("DELETE", `/menu/${created.id}`, { cookie: admin })).status, 200);
  });
  it("refuses to delete a category that still has items", async () => {
    const res = await t.api("PUT", "/restaurant", { cookie: admin, body: { menuCategories: [{ id: cats[1].id, name: "Drinks" }] } });
    assert.equal(res.status, 409); assert.equal(res.body.code, "CATEGORY_IN_USE");
  });
});

describe("testimonials", () => {
  it("full lifecycle: create, publish/feature, edit, delete", async () => {
    const c = await t.api("POST", "/testimonials", { cookie: admin, body: { guestName: "Sara", rating: 5, review: "Lovely stay", guestLocation: "Lahore" } });
    assert.equal(c.status, 201); assert.equal(c.body.data.isPublished, false);
    assert.ok(!(await t.api("GET", "/testimonials")).body.data.some((x) => x.id === c.body.data.id));
    const pub = await t.api("PUT", `/testimonials/${c.body.data.id}`, { cookie: admin, body: { isPublished: true, isFeatured: true, rating: 4 } });
    assert.equal(pub.body.data.rating, 4);
    assert.ok((await t.api("GET", "/testimonials?featured=true")).body.data.some((x) => x.id === c.body.data.id));
    assert.equal((await t.api("POST", "/testimonials", { cookie: admin, body: { guestName: "A", rating: 6, review: "ok fine" } })).status, 422);
    assert.equal((await t.api("DELETE", `/testimonials/${c.body.data.id}`, { cookie: admin })).status, 200);
  });
});

describe("contact messages", () => {
  it("public submits; staff can search, read (auto-marks read), mark unread, change status, delete", async () => {
    const post = await t.api("POST", "/contact", { body: { name: "Omar", email: "omar@example.com", phone: "+92 300 1112233", subject: "Trek dates", message: "Do you have rooms in June for a trek?" } });
    assert.equal(post.status, 201);
    assert.equal((await t.api("POST", "/contact", { body: { name: "O", email: "bad", subject: "x", message: "short" } })).status, 422);
    const list = await t.api("GET", "/contact?q=trek", { cookie: staff });
    assert.equal(list.body.data.length, 1); assert.equal(list.body.data[0].isRead, false);
    const id = list.body.data[0].id;
    assert.equal((await t.api("GET", `/contact/${id}`, { cookie: staff })).body.data.isRead, true);
    assert.equal((await t.api("PATCH", `/contact/${id}`, { cookie: staff, body: { isRead: false } })).body.data.isRead, false);
    assert.equal((await t.api("PATCH", `/contact/${id}`, { cookie: staff, body: { status: "replied" } })).body.data.status, "replied");
    assert.equal((await t.api("GET", "/contact?status=replied&isRead=false", { cookie: staff })).body.data.length, 1);
    assert.equal((await t.api("DELETE", `/contact/${id}`, { cookie: staff })).status, 200);
    const { Notification } = await import("../src/models/Notification.js");
    assert.ok(await Notification.exists({ type: "contact" }), "dashboard notification created");
  });
  it("a new booking creates a dashboard notification", async () => {
    const room = await makeRoom({ totalRooms: 5 });
    await t.api("POST", "/bookings", { body: bookingPayload(room.slug, await addDays(t0, 55), await addDays(t0, 57)) });
    await new Promise((r) => setTimeout(r, 100));
    const { Notification } = await import("../src/models/Notification.js");
    assert.ok(await Notification.exists({ type: "booking" }));
  });
});

describe("settings", () => {
  it("is public to read and admin-only to change; supports partial updates and the logo", async () => {
    const get = await t.api("GET", "/settings");
    assert.equal(get.status, 200); assert.equal(get.body.data.hotelName, "Shimshal Heights");
    const upd = await t.api("PUT", "/settings", { cookie: admin, body: { whatsappNumber: "923001234567", checkInTime: "13:00", socialLinks: { instagram: "https://instagram.com/shimshalheights" }, seo: { title: "Shimshal Heights" }, contactNumbers: ["+92 300 1234567"] } });
    assert.equal(upd.status, 200, JSON.stringify(upd.body));
    assert.equal(upd.body.data.checkInTime, "13:00");
    assert.equal(upd.body.data.socialLinks.instagram, "https://instagram.com/shimshalheights");
    assert.equal(upd.body.data.hotelName, "Shimshal Heights", "untouched fields are preserved");
    const again = await t.api("PUT", "/settings", { cookie: admin, body: { socialLinks: { facebook: "https://facebook.com/sh" } } });
    assert.equal(again.body.data.socialLinks.instagram, "https://instagram.com/shimshalheights", "partial social update keeps other links");
    assert.equal((await t.api("GET", "/settings")).body.data.checkInTime, "13:00", "changes are visible publicly");
    const logo = await t.api("PUT", "/settings", { cookie: admin, form: imageForm({ hotelName: "Shimshal Heights" }, "logo", 1) });
    assert.equal(logo.status, 200);
    const first = logo.body.data.logo.publicId;
    assert.ok(first.startsWith("shimshal-heights/logo/"));
    stub.log.destroyed.length = 0;
    const replaced = await t.api("PUT", "/settings", { cookie: admin, form: imageForm({}, "logo", 1) });
    assert.notEqual(replaced.body.data.logo.publicId, first);
    assert.deepEqual(stub.log.destroyed, [first]);
  });
  it("validates formats and blocks non-admins", async () => {
    assert.equal((await t.api("PUT", "/settings", { cookie: admin, body: { checkInTime: "25:99" } })).status, 422);
    assert.equal((await t.api("PUT", "/settings", { cookie: admin, body: { whatsappNumber: "+92 300" } })).status, 422);
    assert.equal((await t.api("PUT", "/settings", { cookie: admin, body: { googleMapsUrl: "javascript:alert(1)" } })).status, 422);
    assert.equal((await t.api("PUT", "/settings", { cookie: staff, body: { hotelName: "Hacked" } })).status, 403);
    assert.equal((await t.api("GET", "/settings")).body.data.hotelName, "Shimshal Heights");
  });
});
