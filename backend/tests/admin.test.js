import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { addDays, bookingPayload, loginCookie, makeRoom, makeUser, startTestServer, today } from "./helpers.js";

let t; let admin; let staff; let t0;
before(async () => {
  t = await startTestServer("sh_admin");
  await makeUser("admin"); await makeUser("staff");
  admin = await loginCookie(t.api, "admin@example.com");
  staff = await loginCookie(t.api, "staff@example.com");
  t0 = await today();
});
after(() => t.stop());

describe("dashboard stats", () => {
  it("requires staff or admin", async () => {
    assert.equal((await t.api("GET", "/admin/stats")).status, 401);
    assert.equal((await t.api("GET", "/admin/stats", { cookie: staff })).status, 200);
  });

  it("starts empty and zeroed", async () => {
    const d = (await t.api("GET", "/admin/stats", { cookie: admin })).body.data;
    assert.equal(d.bookings.total, 0); assert.equal(d.revenue.paid, 0); assert.equal(d.rooms.total, 0);
    assert.equal(d.trends.bookingsByMonth.length, 6);
    assert.ok(d.trends.revenueByMonth.every((m) => m.value === 0));
  });

  it("counts bookings by status, paid revenue, room availability and trends correctly", async () => {
    const room = await makeRoom({ totalRooms: 5, pricePerNight: 10000, maxAdults: 4 });
    await makeRoom({ totalRooms: 2, isActive: false }); // inactive rooms do not count
    const mk = async (off, extra = {}) => (await t.api("POST", "/bookings", { body: bookingPayload(room.slug, await addDays(t0, off), await addDays(t0, off + 2), extra) })).body.data.reference;
    const { Booking } = await import("../src/models/Booking.js");
    const ids = {};
    for (const [name, off] of [["a", 10], ["b", 20], ["c", 30], ["d", 40]]) ids[name] = (await Booking.findOne({ bookingReference: await mk(off) })).id;
    // Occupying tonight: a booking that started yesterday and ends tomorrow, 2 rooms
    await mk(-1, { rooms: 2 }).catch(() => {});
    const patch = (id, path, body) => t.api("PATCH", `/bookings/${id}/${path}`, { cookie: admin, body });
    await patch(ids.a, "status", { status: "confirmed" }); await patch(ids.a, "payment", { paymentStatus: "paid" });
    await patch(ids.b, "status", { status: "confirmed" }); await patch(ids.b, "payment", { paymentStatus: "paid" }); await patch(ids.b, "payment", { paymentStatus: "refunded" });
    await patch(ids.c, "status", { status: "cancelled" });
    await patch(ids.d, "status", { status: "rejected" });

    const d = (await t.api("GET", "/admin/stats", { cookie: admin })).body.data;
    assert.equal(d.bookings.total, 4);
    assert.deepEqual([d.bookings.pending, d.bookings.confirmed, d.bookings.cancelled, d.bookings.rejected], [0, 2, 1, 1]);
    assert.equal(d.revenue.paid, 20000, "only the paid booking counts; the refunded one does not");
    assert.equal(d.rooms.total, 5, "inactive room excluded");
    assert.equal(d.rooms.reservedTonight + d.rooms.availableTonight, d.rooms.total);
    assert.equal(d.recentBookings.length, 4);
    assert.ok(d.recentBookings[0].bookingReference.startsWith("SH-"));
    const thisMonth = new Date().toISOString().slice(0, 7);
    assert.equal(d.trends.bookingsByMonth.at(-1).month, thisMonth);
    assert.equal(d.trends.bookingsByMonth.reduce((s, m) => s + m.value, 0), 4);
    assert.equal(d.trends.revenueByMonth.reduce((s, m) => s + m.value, 0), 20000);
  });

  it("reserved-tonight reflects a stay that spans tonight", async () => {
    const room = await makeRoom({ totalRooms: 3, maxAdults: 4 });
    const { Booking } = await import("../src/models/Booking.js");
    const { InventoryNight } = await import("../src/models/InventoryNight.js");
    // Created directly: the public API (rightly) refuses stays starting in the past.
    await InventoryNight.create({ room: room._id, date: t0, reserved: 2 });
    void Booking;
    const d = (await t.api("GET", "/admin/stats", { cookie: admin })).body.data;
    assert.ok(d.rooms.reservedTonight >= 2);
    assert.ok(d.rooms.availableTonight <= d.rooms.total - 2);
  });

  it("counts unread contact messages", async () => {
    await t.api("POST", "/contact", { body: { name: "Ann", email: "ann@example.com", subject: "Hello", message: "A real message here." } });
    assert.equal((await t.api("GET", "/admin/stats", { cookie: admin })).body.data.unreadMessages, 1);
  });
});

describe("notifications feed", () => {
  it("lists newest first with an unread count, and can mark one or all as read", async () => {
    assert.equal((await t.api("GET", "/admin/notifications")).status, 401);
    const list = await t.api("GET", "/admin/notifications", { cookie: staff });
    assert.equal(list.status, 200);
    assert.ok(list.body.data.length >= 2, "booking + contact notifications exist");
    assert.equal(list.body.meta.unread, list.body.data.length);
    const one = await t.api("PATCH", `/admin/notifications/${list.body.data[0].id}/read`, { cookie: staff });
    assert.equal(one.body.data.isRead, true);
    assert.equal((await t.api("GET", "/admin/notifications", { cookie: staff })).body.meta.unread, list.body.data.length - 1);
    assert.equal((await t.api("PATCH", "/admin/notifications/read-all", { cookie: staff })).status, 200);
    assert.equal((await t.api("GET", "/admin/notifications", { cookie: staff })).body.meta.unread, 0);
    assert.equal((await t.api("PATCH", "/admin/notifications/not-an-id/read", { cookie: staff })).status, 422);
  });
});
