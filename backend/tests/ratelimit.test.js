import assert from "node:assert/strict";
import { after, before, it } from "node:test";
process.env.RATE_LIMIT_ENABLED = "true"; // set before helpers import so the app builds with limiters on
const { startTestServer, makeUser } = await import("./helpers.js");

let t;
before(async () => { t = await startTestServer("sh_rate"); await makeUser("admin"); });
after(() => t.stop());

it("locks brute-force login attempts with 429 after 10 tries", async () => {
  const codes = [];
  for (let i = 0; i < 13; i += 1) codes.push((await t.api("POST", "/auth/login", { body: { email: "admin@example.com", password: `wrong-${i}` } })).status);
  assert.equal(codes.slice(0, 10).every((c) => c === 401), true, codes.join());
  assert.equal(codes.slice(10).every((c) => c === 429), true, codes.join());
});

it("throttles contact spam", async () => {
  const body = { name: "Ann", email: "ann@example.com", subject: "Hello", message: "A real message here." };
  const codes = [];
  for (let i = 0; i < 12; i += 1) codes.push((await t.api("POST", "/contact", { body })).status);
  assert.equal(codes.filter((c) => c === 201).length, 10, codes.join());
  assert.equal(codes.filter((c) => c === 429).length, 2);
});
