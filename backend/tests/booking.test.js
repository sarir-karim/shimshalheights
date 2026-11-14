import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { addDays, bookingPayload, loginCookie, makeRoom, makeUser, startTestServer, today } from "./helpers.js";

let t; let admin; let t0;
before(async () => {
  t = await startTestServer("sh_booking");
  await makeUser("admin");
  admin = await loginCookie(t.api, "admin@example.com");
  t0 = await today();
});
after(() => t.stop());

const inv = async (room) => {
  const { InventoryNight } = await import("../src/models/InventoryNight.js");
  return InventoryNight.find({ room: room._id }).lean();
};

describe("availability and double-booking", () => {
  it("creates a PENDING booking with server-computed price and a reference", async () => {
    const room = await makeRoom({ pricePerNight: 8000, totalRooms: 2 });
    const res = await t.api("POST", "/bookings", { body: bookingPayload(room.slug, await addDays(t0, 10), await addDays(t0, 13), { totalPrice: 1, pricePerNight: 1 }) });
    assert.equal(res.status, 201);
    assert.equal(res.body.data.status, "pending");
    assert.match(res.body.data.reference, /^SH-\d{8}-[A-Z2-9]{5}$/);
    assert.equal(res.body.data.summary.totalPrice, 24000, "price must come from the server, not the client");
    assert.equal(res.body.data.summary.nights, 3);
  });

  it("blocks overlapping dates once all units are taken, using the overlap rule", async () => {
    const room = await makeRoom({ totalRooms: 1 });
    const [a, b] = [await addDays(t0, 20), await addDays(t0, 23)]; // 3 nights
    assert.equal((await t.api("POST", "/bookings", { body: bookingPayload(room.slug, a, b) })).status, 201);
    for (const [ci, co] of [[a, b], [await addDays(t0, 21), await addDays(t0, 22)], [await addDays(t0, 18), await addDays(t0, 21)], [await addDays(t0, 22), await addDays(t0, 26)], [await addDays(t0, 15), await addDays(t0, 30)]]) {
      const res = await t.api("POST", "/bookings", { body: bookingPayload(room.slug, ci, co) });
      assert.equal(res.status, 409, `${ci}..${co} should overlap`);
      assert.equal(res.body.code, "NOT_AVAILABLE");
    }
  });

  it("allows back-to-back stays (check-out day = next check-in day)", async () => {
    const room = await makeRoom({ totalRooms: 1 });
    const [d1, d2, d3] = [await addDays(t0, 40), await addDays(t0, 43), await addDays(t0, 45)];
    assert.equal((await t.api("POST", "/bookings", { body: bookingPayload(room.slug, d1, d2) })).status, 201);
    assert.equal((await t.api("POST", "/bookings", { body: bookingPayload(room.slug, d2, d3) })).status, 201);
    assert.equal((await t.api("POST", "/bookings", { body: bookingPayload(room.slug, await addDays(t0, 38), d1) })).status, 201);
  });

  it("supports several physical rooms of one type (totalRooms)", async () => {
    const room = await makeRoom({ totalRooms: 3, maxAdults: 4 });
    const [a, b] = [await addDays(t0, 50), await addDays(t0, 52)];
    assert.equal((await t.api("POST", "/bookings", { body: bookingPayload(room.slug, a, b, { rooms: 2, adults: 4 }) })).status, 201);
    assert.equal((await t.api("POST", "/bookings", { body: bookingPayload(room.slug, a, b, { rooms: 2, adults: 2 }) })).status, 409, "2 more would make 4 of 3");
    assert.equal((await t.api("POST", "/bookings", { body: bookingPayload(room.slug, a, b, { rooms: 1 }) })).status, 201);
  });

  it("availability endpoint reports remaining units per night, not a naive sum", async () => {
    const room = await makeRoom({ totalRooms: 2 });
    // Two bookings that each overlap the search window but never overlap each other.
    await t.api("POST", "/bookings", { body: bookingPayload(room.slug, await addDays(t0, 60), await addDays(t0, 62)) });
    await t.api("POST", "/bookings", { body: bookingPayload(room.slug, await addDays(t0, 65), await addDays(t0, 67)) });
    const q = new URLSearchParams({ checkIn: await addDays(t0, 59), checkOut: await addDays(t0, 68), adults: "2", roomSlug: room.slug });
    const res = await t.api("GET", `/bookings/availability?${q}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.data.length, 1);
    assert.equal(res.body.data[0].availableUnits, 1, "peak is 1 unit per night, so 1 of 2 remains");
    assert.equal(res.body.data[0].room.slug, room.slug);
    assert.equal(res.body.data[0].nights, 9);
    // Fully booked window is omitted
    const full = new URLSearchParams({ checkIn: await addDays(t0, 60), checkOut: await addDays(t0, 62), adults: "2", rooms: "2", roomSlug: room.slug });
    assert.equal((await t.api("GET", `/bookings/availability?${full}`)).body.data.length, 0);
  });

  it("rejects capacity, past dates, reversed dates, long stays and bad input", async () => {
    const room = await makeRoom({ maxAdults: 2, maxChildren: 0, totalRooms: 2 });
    const [a, b] = [await addDays(t0, 70), await addDays(t0, 72)];
    const cases = [
      [bookingPayload(room.slug, a, b, { adults: 3 }), 422, "CAPACITY_EXCEEDED"],
      [bookingPayload(room.slug, a, b, { children: 1 }), 422, "CAPACITY_EXCEEDED"],
      [bookingPayload(room.slug, a, b, { rooms: 3 }), 422, "CAPACITY_EXCEEDED"],
      [bookingPayload(room.slug, await addDays(t0, -2), await addDays(t0, 1)), 422, "INVALID_DATES"],
      [bookingPayload(room.slug, b, a), 422, "VALIDATION_ERROR"],
      [bookingPayload(room.slug, a, await addDays(a, 31)), 422, "INVALID_DATES"],
      [bookingPayload(room.slug, a, b, { guestEmail: "not-an-email" }), 422, "VALIDATION_ERROR"],
      [bookingPayload(room.slug, a, b, { guestPhone: "abc" }), 422, "VALIDATION_ERROR"],
      [bookingPayload(room.slug, "2027-02-30", "2027-03-02"), 422, "VALIDATION_ERROR"],
      [bookingPayload("no-such-room", a, b), 404, "NOT_FOUND"],
    ];
    for (const [body, status, code] of cases) {
      const res = await t.api("POST", "/bookings", { body });
      assert.equal(res.status, status, JSON.stringify(body).slice(0, 80));
      assert.equal(res.body.code, code);
    }
    assert.equal((await inv(room)).length, 0, "failed requests must not leave reserved nights behind");
  });

  it("does not book inactive rooms", async () => {
    const room = await makeRoom({ isActive: false });
    const res = await t.api("POST", "/bookings", { body: bookingPayload(room.slug, await addDays(t0, 80), await addDays(t0, 82)) });
    assert.equal(res.status, 404);
  });
});

describe("concurrency", () => {
  it("20 simultaneous requests for 3 units: exactly 3 succeed, ledger never exceeds inventory", async () => {
    const room = await makeRoom({ totalRooms: 3 });
    const [a, b] = [await addDays(t0, 100), await addDays(t0, 103)];
    const results = await Promise.all(Array.from({ length: 20 }, (_, i) => t.api("POST", "/bookings", { body: bookingPayload(room.slug, a, b, { guestName: `Guest ${i}` }) })));
    const ok = results.filter((r) => r.status === 201).length;
    const conflict = results.filter((r) => r.status === 409).length;
    assert.equal(ok, 3, `expected 3 successes, got ${ok}`);
    assert.equal(conflict, 17);
    const rows = await inv(room);
    assert.equal(rows.length, 3);
    for (const row of rows) assert.equal(row.reserved, 3);
    const { Booking } = await import("../src/models/Booking.js");
    assert.equal(await Booking.countDocuments({ room: room._id }), 3);
  });

  it("mixed overlapping ranges under load: no night is ever over-reserved and rollbacks leave no residue", async () => {
    const room = await makeRoom({ totalRooms: 2 });
    const ranges = [[0, 3], [2, 5], [4, 7], [1, 6], [0, 7], [3, 4], [5, 7], [2, 3]];
    const reqs = [];
    for (let rep = 0; rep < 4; rep += 1) for (const [s, e] of ranges) reqs.push(t.api("POST", "/bookings", { body: bookingPayload(room.slug, `${await addDays(t0, 120 + s)}`, `${await addDays(t0, 120 + e)}`) }));
    const results = await Promise.all(reqs);
    const oks = results.filter((r) => r.status === 201).length;
    assert.ok(oks >= 2 && oks < reqs.length, `some but not all should succeed (got ${oks}/${reqs.length})`);
    const { Booking } = await import("../src/models/Booking.js");
    const { InventoryNight } = await import("../src/models/InventoryNight.js");
    const rows = await InventoryNight.find({ room: room._id }).lean();
    assert.ok(rows.every((r) => r.reserved >= 0 && r.reserved <= 2), "no night may exceed totalRooms");
    // Ledger must equal what the saved bookings actually need, night by night.
    const expected = new Map();
    for (const bk of await Booking.find({ room: room._id }).lean()) {
      for (let d = bk.checkIn.getTime(); d < bk.checkOut.getTime(); d += 86_400_000) {
        const k = new Date(d).toISOString().slice(0, 10);
        expected.set(k, (expected.get(k) ?? 0) + bk.numberOfRooms);
      }
    }
    for (const row of rows) assert.equal(row.reserved, expected.get(row.date) ?? 0, `ledger drift on ${row.date}`);
    assert.equal(await Booking.countDocuments({ room: room._id }), oks);
  });
});

describe("status workflow and inventory release", () => {
  const make = async (room, off = 200) => (await t.api("POST", "/bookings", { body: bookingPayload(room.slug, await addDays(t0, off), await addDays(t0, off + 2)) })).body.data;

  it("requires staff/admin and records history", async () => {
    const room = await makeRoom();
    const bk = await make(room);
    const { Booking } = await import("../src/models/Booking.js");
    const doc = await Booking.findOne({ bookingReference: bk.reference });
    assert.equal((await t.api("PATCH", `/bookings/${doc.id}/status`, { body: { status: "confirmed" } })).status, 401);
    const res = await t.api("PATCH", `/bookings/${doc.id}/status`, { cookie: admin, body: { status: "confirmed", note: "Called guest" } });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.status, "confirmed");
    assert.deepEqual(res.body.data.statusHistory.map((h) => h.status), ["pending", "confirmed"]);
    assert.equal(res.body.data.statusHistory[1].note, "Called guest");
  });

  it("rejecting or cancelling releases the dates so they can be booked again", async () => {
    for (const status of ["rejected", "cancelled"]) {
      const room = await makeRoom({ totalRooms: 1 });
      const bk = await make(room, 220);
      const { Booking } = await import("../src/models/Booking.js");
      const doc = await Booking.findOne({ bookingReference: bk.reference });
      assert.equal((await t.api("POST", "/bookings", { body: bookingPayload(room.slug, await addDays(t0, 220), await addDays(t0, 222)) })).status, 409);
      assert.equal((await t.api("PATCH", `/bookings/${doc.id}/status`, { cookie: admin, body: { status } })).status, 200);
      assert.equal((await t.api("POST", "/bookings", { body: bookingPayload(room.slug, await addDays(t0, 220), await addDays(t0, 222)) })).status, 201, `${status} should free the room`);
    }
  });

  it("enforces valid transitions and treats final states as final", async () => {
    const room = await makeRoom({ totalRooms: 2 });
    const { Booking } = await import("../src/models/Booking.js");
    const doc = await Booking.findOne({ bookingReference: (await make(room, 240)).reference });
    const patch = (status) => t.api("PATCH", `/bookings/${doc.id}/status`, { cookie: admin, body: { status } });
    assert.equal((await patch("completed")).status, 409, "pending cannot jump to completed");
    assert.equal((await patch("confirmed")).status, 200);
    assert.equal((await patch("rejected")).status, 409, "confirmed cannot be rejected");
    assert.equal((await patch("completed")).status, 200);
    const again = await patch("cancelled");
    assert.equal(again.status, 409);
    assert.equal(again.body.code, "INVALID_TRANSITION");
  });

  it("two admins acting at once: only one transition wins and inventory is released once", async () => {
    const room = await makeRoom({ totalRooms: 1 });
    const { Booking } = await import("../src/models/Booking.js");
    const { InventoryNight } = await import("../src/models/InventoryNight.js");
    const doc = await Booking.findOne({ bookingReference: (await make(room, 260)).reference });
    const rs = await Promise.all(["rejected", "cancelled", "confirmed"].map((status) => t.api("PATCH", `/bookings/${doc.id}/status`, { cookie: admin, body: { status } })));
    assert.equal(rs.filter((r) => r.status === 200).length, 1);
    const rows = await InventoryNight.find({ room: room._id }).lean();
    assert.ok(rows.every((r) => r.reserved >= 0 && r.reserved <= 1));
  });

  it("payment status rules", async () => {
    const room = await makeRoom({ totalRooms: 3 });
    const { Booking } = await import("../src/models/Booking.js");
    const doc = await Booking.findOne({ bookingReference: (await make(room, 280)).reference });
    const pay = (paymentStatus) => t.api("PATCH", `/bookings/${doc.id}/payment`, { cookie: admin, body: { paymentStatus } });
    assert.equal((await pay("refunded")).status, 409, "cannot refund unpaid");
    assert.equal((await pay("paid")).body.data.paymentStatus, "paid");
    assert.equal((await pay("refunded")).body.data.paymentStatus, "refunded");
    await t.api("PATCH", `/bookings/${doc.id}/status`, { cookie: admin, body: { status: "cancelled" } });
    assert.equal((await pay("paid")).status, 409, "cannot take payment for cancelled booking");
  });
});

describe("admin booking list", () => {
  it("paginates, filters by status/date, and searches by reference or guest name", async () => {
    const room = await makeRoom({ totalRooms: 10 });
    const names = ["Alice Khan", "Bilal Shah", "Carla Ruiz"];
    const refs = [];
    for (let i = 0; i < 3; i += 1) refs.push((await t.api("POST", "/bookings", { body: bookingPayload(room.slug, await addDays(t0, 300 + i * 5), await addDays(t0, 302 + i * 5), { guestName: names[i] }) })).body.data.reference);
    assert.equal((await t.api("GET", "/bookings")).status, 401);
    const page = await t.api("GET", "/bookings?limit=2&page=1&sort=checkin-asc", { cookie: admin });
    assert.equal(page.status, 200);
    assert.equal(page.body.data.length, 2);
    assert.ok(page.body.meta.total >= 3 && page.body.meta.totalPages >= 2);
    assert.equal((await t.api("GET", `/bookings?q=${refs[1].toLowerCase()}`, { cookie: admin })).body.data[0].guestName, "Bilal Shah");
    assert.equal((await t.api("GET", "/bookings?q=carla", { cookie: admin })).body.data.length, 1);
    assert.equal((await t.api("GET", "/bookings?q=.*", { cookie: admin })).body.data.length, 0, "regex characters are escaped");
    const from = await addDays(t0, 304); const to = await addDays(t0, 311);
    assert.equal((await t.api("GET", `/bookings?from=${from}&to=${to}&q=a`, { cookie: admin })).body.data.every((b) => b.checkIn >= `${from}`), true);
    assert.equal((await t.api("GET", "/bookings?status=confirmed&q=Alice", { cookie: admin })).body.data.length, 0);
    assert.equal((await t.api("GET", "/bookings?status=bogus", { cookie: admin })).status, 422);
  });
});

describe("inventory repair", () => {
  it("rebuildInventory restores a drifted ledger from active bookings", async () => {
    const room = await makeRoom({ totalRooms: 2 });
    await t.api("POST", "/bookings", { body: bookingPayload(room.slug, await addDays(t0, 400), await addDays(t0, 402)) });
    const { InventoryNight } = await import("../src/models/InventoryNight.js");
    await InventoryNight.deleteMany({ room: room._id }); // simulate a crash that lost the ledger
    const { rebuildInventory } = await import("../src/services/availability.service.js");
    await rebuildInventory();
    const rows = await InventoryNight.find({ room: room._id }).lean();
    assert.equal(rows.length, 2);
    assert.ok(rows.every((r) => r.reserved === 1));
  });
});
