// Test environment must be set BEFORE any app module is imported (config reads env at import time).
process.env.NODE_ENV = "test";
process.env.MONGODB_URI ??= "mongodb://127.0.0.1:27017";
process.env.JWT_SECRET ??= "test-secret-test-secret-test-secret-123456";
process.env.RATE_LIMIT_ENABLED ??= "false";
process.env.CLIENT_ORIGINS = "http://localhost:3000";

import mongoose from "mongoose";

export async function startTestServer(name = "sh_test") {
  const dbName = `${name}_${process.pid}_${Date.now()}`;
  const { connectDB, disconnectDB } = await import("../src/config/db.js");
  await import("../src/models/index.js");
  const { createApp } = await import("../src/app.js");
  await connectDB(`${process.env.MONGODB_URI.replace(/\/$/, "")}/${dbName}`);
  await Promise.all(Object.values(mongoose.models).map((m) => m.init())); // unique indexes must exist
  const server = createApp().listen(0);
  const base = `http://127.0.0.1:${server.address().port}/api`;

  async function api(method, path, { body, cookie, headers = {}, form } = {}) {
    const res = await fetch(base + path, {
      method,
      headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(cookie ? { Cookie: cookie } : {}), ...headers },
      body: form ?? (body ? JSON.stringify(body) : undefined),
    });
    const json = await res.json().catch(() => null);
    return { status: res.status, body: json, headers: res.headers };
  }

  return {
    api,
    async stop() {
      await mongoose.connection.dropDatabase();
      await new Promise((r) => server.close(r));
      await disconnectDB();
    },
  };
}

export async function makeUser(role = "admin", email = `${role}@example.com`) {
  const { User } = await import("../src/models/User.js");
  return User.create({ name: `${role} user`, email, password: "correct-horse-battery", role });
}

export async function loginCookie(api, email, password = "correct-horse-battery") {
  const res = await api("POST", "/auth/login", { body: { email, password } });
  if (res.status !== 200) throw new Error(`login failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
}

export async function makeRoom(overrides = {}) {
  const { Room } = await import("../src/models/Room.js");
  return Room.create({
    name: "Test Room", slug: `test-room-${Math.random().toString(36).slice(2, 8)}`, description: "d", shortDescription: "s",
    pricePerNight: 10000, roomType: "standard", maxAdults: 2, maxChildren: 1, totalRooms: 1, bedConfiguration: "1 double bed", ...overrides,
  });
}

export async function addDays(iso, n) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export async function today() {
  return (await import("../src/utils/dates.js")).todayInHotelTz();
}

export const bookingPayload = (slug, checkIn, checkOut, extra = {}) => ({
  roomSlug: slug, checkIn, checkOut, adults: 2, children: 0, rooms: 1,
  guestName: "Test Guest", guestEmail: "guest@example.com", guestPhone: "+92 300 1234567", ...extra,
});

/** Replaces Cloudinary calls with in-memory fakes and records what was uploaded/destroyed. */
export async function stubUploads() {
  const { uploadService } = await import("../src/services/upload.service.js");
  const original = { ...uploadService };
  const log = { uploaded: [], destroyed: [] };
  let n = 0;
  uploadService.assertConfigured = () => {};
  uploadService.uploadBuffer = async (_buf, folder) => {
    n += 1;
    const r = { url: `https://res.cloudinary.com/test/image/upload/${folder}/img${n}.png`, publicId: `${folder}/img${n}` };
    log.uploaded.push(r.publicId);
    return r;
  };
  uploadService.destroy = async (id) => { if (id) log.destroyed.push(id); };
  uploadService.destroyMany = async (ids) => { for (const id of ids) if (id) log.destroyed.push(id); };
  return { log, restore: () => Object.assign(uploadService, original) };
}

export const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64)]);
export function imageForm(fields = {}, fileField = "images", count = 1, file = PNG, filename = "photo.png", type = "image/png") {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.append(k, typeof v === "string" ? v : JSON.stringify(v));
  for (let i = 0; i < count; i += 1) form.append(fileField, new Blob([file], { type }), filename);
  return form;
}
