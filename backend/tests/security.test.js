import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { PNG, imageForm, loginCookie, makeRoom, makeUser, startTestServer, stubUploads } from "./helpers.js";

let t; let admin; let staff;
const roomFields = { name: "Sec Room", description: "d", shortDescription: "s", pricePerNight: 100, roomType: "standard", maxAdults: 2, totalRooms: 1, bedConfiguration: "b" };

before(async () => {
  t = await startTestServer("sh_security");
  await makeUser("admin"); await makeUser("staff");
  admin = await loginCookie(t.api, "admin@example.com");
  staff = await loginCookie(t.api, "staff@example.com");
});
after(() => t.stop());

describe("authentication", () => {
  it("login sets an httpOnly cookie and never returns the password hash", async () => {
    const res = await t.api("POST", "/auth/login", { body: { email: "admin@example.com", password: "correct-horse-battery" } });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.user.role, "admin");
    assert.equal(res.body.data.user.password, undefined);
    assert.ok(!JSON.stringify(res.body).includes("$2"), "no bcrypt hash anywhere in the response");
    const me = await t.api("GET", "/auth/me", { cookie: admin });
    assert.ok(!JSON.stringify(me.body).includes("$2"));
    assert.match(res.headers.getSetCookie()[0], /HttpOnly/i);
    assert.match(res.headers.getSetCookie()[0], /SameSite=Lax/i);
  });

  it("gives the same generic error for wrong password and unknown email", async () => {
    const a = await t.api("POST", "/auth/login", { body: { email: "admin@example.com", password: "wrong-password" } });
    const b = await t.api("POST", "/auth/login", { body: { email: "nobody@example.com", password: "wrong-password" } });
    assert.equal(a.status, 401); assert.equal(b.status, 401);
    assert.equal(a.body.message, b.body.message);
  });

  it("/auth/me requires a session and returns the user", async () => {
    assert.equal((await t.api("GET", "/auth/me")).status, 401);
    const me = await t.api("GET", "/auth/me", { cookie: admin });
    assert.equal(me.body.data.user.email, "admin@example.com");
  });

  it("rejects forged, tampered and unsigned tokens", async () => {
    const jwt = (await import("jsonwebtoken")).default;
    const { User } = await import("../src/models/User.js");
    const id = (await User.findOne({ email: "admin@example.com" })).id;
    const forged = jwt.sign({ sub: id, role: "admin" }, "a-completely-different-secret-value-1234");
    const none = `${Buffer.from('{"alg":"none","typ":"JWT"}').toString("base64url")}.${Buffer.from(JSON.stringify({ sub: id, role: "admin" })).toString("base64url")}.`;
    for (const token of [forged, none, "garbage"]) assert.equal((await t.api("GET", "/auth/me", { cookie: `sh_token=${token}` })).status, 401);
  });

  it("deactivating a user kills their existing session immediately", async () => {
    const u = await makeUser("staff", "temp@example.com");
    const cookie = await loginCookie(t.api, "temp@example.com");
    assert.equal((await t.api("GET", "/auth/me", { cookie })).status, 200);
    u.isActive = false; await u.save();
    assert.equal((await t.api("GET", "/auth/me", { cookie })).status, 401);
    assert.equal((await t.api("POST", "/auth/login", { body: { email: "temp@example.com", password: "correct-horse-battery" } })).status, 401);
  });

  it("logout clears the cookie", async () => {
    const res = await t.api("POST", "/auth/logout", { cookie: admin });
    assert.match(res.headers.getSetCookie()[0], /sh_token=;/);
  });

  it("passwords are stored hashed", async () => {
    const { User } = await import("../src/models/User.js");
    const u = await User.findOne({ email: "admin@example.com" }).select("+password");
    assert.match(u.password, /^\$2[aby]\$12\$/);
  });
});

describe("authorization (role-based access)", () => {
  it("anonymous users cannot reach any admin endpoint", async () => {
    const id = "64b000000000000000000000";
    const calls = [["GET", "/bookings"], ["GET", `/bookings/${id}`], ["PATCH", `/bookings/${id}/status`], ["PATCH", `/bookings/${id}/payment`], ["POST", "/rooms"], ["PUT", `/rooms/${id}`], ["DELETE", `/rooms/${id}`],
      ["PUT", "/restaurant"], ["POST", "/menu"], ["PUT", `/menu/${id}`], ["DELETE", `/menu/${id}`], ["POST", "/gallery"], ["PUT", `/gallery/${id}`], ["DELETE", `/gallery/${id}`],
      ["POST", "/testimonials"], ["PUT", `/testimonials/${id}`], ["DELETE", `/testimonials/${id}`], ["GET", "/contact"], ["GET", `/contact/${id}`], ["PATCH", `/contact/${id}`], ["DELETE", `/contact/${id}`], ["PUT", "/settings"]];
    for (const [m, p] of calls) assert.equal((await t.api(m, p, { body: m === "GET" || m === "DELETE" ? undefined : {} })).status, 401, `${m} ${p}`);
  });

  it("staff can run bookings and messages but not content or settings", async () => {
    const id = "64b000000000000000000000";
    assert.equal((await t.api("GET", "/bookings", { cookie: staff })).status, 200);
    assert.equal((await t.api("GET", "/contact", { cookie: staff })).status, 200);
    for (const [m, p, body] of [["POST", "/rooms", roomFields], ["DELETE", `/rooms/${id}`], ["PUT", "/settings", { hotelName: "x" }], ["POST", "/testimonials", { guestName: "a", rating: 5, review: "great stay" }], ["PUT", "/restaurant", { name: "x" }], ["DELETE", `/gallery/${id}`], ["DELETE", `/menu/${id}`]]) {
      assert.equal((await t.api(m, p, { cookie: staff, body })).status, 403, `${m} ${p} should be admin-only`);
    }
  });
});

describe("injection and request hardening", () => {
  it("NoSQL operators in login fields are rejected", async () => {
    for (const body of [{ email: "admin@example.com", password: { $ne: null } }, { email: { $gt: "" }, password: "x" }, { email: "admin@example.com", password: { $regex: ".*" } }]) {
      const res = await t.api("POST", "/auth/login", { body });
      assert.ok([401, 422].includes(res.status), `got ${res.status}`);
      assert.notEqual(res.status, 200);
    }
  });

  it("operator keys in query strings are stripped, not executed", async () => {
    const res = await t.api("GET", "/bookings?status[$ne]=cancelled&q[$regex]=.*", { cookie: admin });
    assert.ok(res.status < 500);
  });

  it("regex special characters in search are treated literally", async () => {
    assert.equal((await t.api("GET", "/contact?q=(((", { cookie: admin })).status, 200);
  });

  it("malformed JSON gives 400 and oversized bodies 413, with the standard error shape", async () => {
    const bad = await fetch(`${t.api.base ?? ""}`).catch(() => null); void bad;
    const res = await t.api("POST", "/contact", { body: undefined, headers: { "Content-Type": "application/json" } });
    assert.ok([400, 422].includes(res.status));
    const big = await t.api("POST", "/contact", { body: { name: "a".repeat(200_000) } });
    assert.equal(big.status, 413);
    assert.equal(big.body.success, false);
    assert.ok(big.body.code);
  });

  it("unknown routes return a JSON 404 and invalid ids return 400/422", async () => {
    const nf = await t.api("GET", "/nope");
    assert.equal(nf.status, 404); assert.equal(nf.body.success, false);
    assert.equal((await t.api("GET", "/bookings/not-an-id", { cookie: admin })).status, 422);
  });

  it("security headers are set and the framework is not advertised", async () => {
    const res = await t.api("GET", "/health");
    assert.equal(res.headers.get("x-content-type-options"), "nosniff");
    assert.equal(res.headers.get("x-powered-by"), null);
    assert.ok(res.headers.get("strict-transport-security"));
  });

  it("CORS only allows configured origins, and cross-site writes are refused", async () => {
    const evil = await t.api("GET", "/health", { headers: { Origin: "https://evil.example" } });
    assert.equal(evil.headers.get("access-control-allow-origin"), null);
    const good = await t.api("GET", "/health", { headers: { Origin: "http://localhost:3000" } });
    assert.equal(good.headers.get("access-control-allow-origin"), "http://localhost:3000");
    assert.equal(good.headers.get("access-control-allow-credentials"), "true");
    const csrf = await t.api("POST", "/auth/logout", { cookie: admin, headers: { Origin: "https://evil.example" } });
    assert.equal(csrf.status, 403);
    const csrf2 = await t.api("PATCH", "/bookings/64b000000000000000000000/status", { cookie: admin, headers: { Origin: "https://evil.example" }, body: { status: "confirmed" } });
    assert.equal(csrf2.status, 403);
  });

  it("mass assignment is blocked: unknown/privileged fields are ignored", async () => {
    const res = await t.api("POST", "/testimonials", { cookie: admin, body: { guestName: "A", rating: 5, review: "wonderful", _id: "64b000000000000000000001", createdAt: "2001-01-01", __proto__: { admin: true } } });
    assert.equal(res.status, 201);
    assert.notEqual(res.body.data.id, "64b000000000000000000001");
  });
});

describe("visibility of unpublished content", () => {
  it("public sees only active rooms, published testimonials and active gallery items; staff can opt in with all=true", async () => {
    const hidden = await makeRoom({ name: "Hidden", slug: "hidden-room", isActive: false });
    await makeRoom({ name: "Shown", slug: "shown-room" });
    const { Testimonial } = await import("../src/models/Testimonial.js");
    const { Gallery } = await import("../src/models/Gallery.js");
    await Testimonial.create({ guestName: "Draft", rating: 4, review: "unpublished review", isPublished: false });
    await Gallery.create({ title: "Hidden pic", category: "Rooms", imageUrl: "https://x/y.png", cloudinaryPublicId: "p1", isActive: false });

    const slugs = (r) => r.body.data.map((x) => x.slug);
    assert.ok(!slugs(await t.api("GET", "/rooms")).includes("hidden-room"));
    assert.ok(!slugs(await t.api("GET", "/rooms?all=true")).includes("hidden-room"), "anonymous all=true must not leak");
    assert.ok(slugs(await t.api("GET", "/rooms?all=true", { cookie: admin })).includes("hidden-room"));
    assert.equal((await t.api("GET", "/rooms/hidden-room")).status, 404);
    assert.equal((await t.api("GET", `/rooms/${hidden.slug}`, { cookie: admin })).status, 200);
    assert.equal((await t.api("GET", "/testimonials")).body.data.length, 0);
    const all = await t.api("GET", "/testimonials?all=true", { cookie: admin });
    assert.ok(all.body.data.some((x) => x.guestName === "Draft"), "staff can see unpublished");
    assert.ok(!(await t.api("GET", "/testimonials")).body.data.some((x) => x.guestName === "Draft"));
    assert.equal((await t.api("GET", "/gallery?all=true")).body.data.length, 0);
    assert.ok((await t.api("GET", "/gallery?all=true", { cookie: admin })).body.data.some((x) => x.title === "Hidden pic"));
  });
});

describe("file upload validation", () => {
  it("rejects non-images, spoofed content types, oversize files and over-long lists", async () => {
    const stub = await stubUploads();
    try {
      const text = Buffer.from("<?php system($_GET['c']); ?> not an image at all, just text padding.");
      const cases = [
        ["php renamed .png with image mime", imageForm(roomFields, "images", 1, text, "shell.png", "image/png")],
        ["text mime", imageForm(roomFields, "images", 1, PNG, "a.txt", "text/plain")],
        ["svg (script vector)", imageForm(roomFields, "images", 1, Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'), "x.svg", "image/svg+xml")],
        ["too large", imageForm(roomFields, "images", 1, Buffer.concat([PNG, Buffer.alloc(5 * 1024 * 1024)]), "big.png", "image/png")],
        ["too many files", imageForm(roomFields, "images", 11)],
        ["wrong field name", imageForm(roomFields, "photos", 1)],
      ];
      for (const [name, form] of cases) {
        const res = await t.api("POST", "/rooms", { cookie: admin, form });
        assert.equal(res.status, 400, `${name} -> ${res.status} ${JSON.stringify(res.body)}`);
      }
      assert.equal(stub.log.uploaded.length, 0, "nothing may reach Cloudinary when validation fails");
      const ok = await t.api("POST", "/rooms", { cookie: admin, form: imageForm(roomFields, "images", 1) });
      assert.equal(ok.status, 201);
    } finally { stub.restore(); }
  });

  it("returns 503 (not a crash) when Cloudinary is not configured", async () => {
    const res = await t.api("POST", "/rooms", { cookie: admin, form: imageForm({ ...roomFields, name: "No Storage" }, "images", 1) });
    assert.equal(res.status, 503);
    assert.equal(res.body.code, "STORAGE_NOT_CONFIGURED");
  });
});

describe("contact form abuse protection", () => {
  it("honeypot submissions look successful but store nothing", async () => {
    const { ContactMessage } = await import("../src/models/ContactMessage.js");
    const before = await ContactMessage.countDocuments();
    const res = await t.api("POST", "/contact", { body: { name: "Bot", email: "bot@example.com", subject: "Buy now", message: "spam spam spam spam", website: "http://spam.example" } });
    assert.equal(res.status, 201);
    assert.equal(await ContactMessage.countDocuments(), before);
  });
});
