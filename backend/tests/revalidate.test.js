import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
process.env.FRONTEND_REVALIDATE_URL = "http://127.0.0.1:9/revalidate";
process.env.REVALIDATE_SECRET = "revalidate-secret-1234567890";
const { loginCookie, makeUser, startTestServer } = await import("./helpers.js");

let t; let admin; let calls; let realFetch;
before(async () => {
  t = await startTestServer("sh_reval");
  await makeUser("admin"); await makeUser("staff");
  admin = await loginCookie(t.api, "admin@example.com");
  realFetch = globalThis.fetch;
});
after(async () => { globalThis.fetch = realFetch; await t.stop(); });

// The test client uses fetch too, so only calls to the website hook are intercepted and recorded.
const intercept = () => {
  calls = [];
  globalThis.fetch = (url, opts) => {
    if (String(url).includes("/revalidate")) { calls.push({ url: String(url), headers: opts?.headers }); return Promise.resolve(new Response("{}", { status: 200 })); }
    return realFetch(url, opts);
  };
};
const settle = () => new Promise((r) => setTimeout(r, 120));

describe("website refresh hook", () => {
  it("fires after a successful content write, with the shared secret", async () => {
    intercept();
    const res = await t.api("POST", "/testimonials", { cookie: admin, body: { guestName: "Sara", rating: 5, review: "Lovely stay here" } });
    assert.equal(res.status, 201); await settle();
    assert.equal(calls.length, 1);
    assert.equal(calls[0].headers["x-revalidate-secret"], "revalidate-secret-1234567890");
  });
  it("does not fire for reads, failed writes or unauthorized writes", async () => {
    intercept();
    await t.api("GET", "/testimonials"); await t.api("GET", "/settings");
    await t.api("POST", "/testimonials", { cookie: admin, body: { guestName: "" } }); // 422
    await t.api("POST", "/testimonials", { body: { guestName: "x", rating: 5, review: "no session here" } }); // 401
    await settle();
    assert.equal(calls.length, 0);
  });
  it("fires for settings and does not break the save when the website is down", async () => {
    intercept();
    assert.equal((await t.api("PUT", "/settings", { cookie: admin, body: { hotelName: "Shimshal Heights" } })).status, 200);
    await settle(); assert.equal(calls.length, 1);
    globalThis.fetch = (url, opts) => (String(url).includes("/revalidate") ? Promise.reject(new Error("connect ECONNREFUSED")) : realFetch(url, opts));
    const res = await t.api("PUT", "/settings", { cookie: admin, body: { hotelName: "Shimshal Heights Hotel" } });
    assert.equal(res.status, 200, "an offline website must not fail an admin save");
  });
  it("does not fire for bookings or contact (they never change cached pages)", async () => {
    intercept();
    await t.api("POST", "/contact", { body: { name: "Ann", email: "ann@example.com", subject: "Hello", message: "A real message here." } });
    await settle(); assert.equal(calls.length, 0);
  });
});
