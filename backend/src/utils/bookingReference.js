import { randomInt } from "node:crypto";

// No 0/O/1/I so references can be read out over the phone.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateBookingReference(now = new Date()) {
  const stamp = now.toISOString().slice(0, 10).replace(/-/g, "");
  let suffix = "";
  for (let i = 0; i < 5; i += 1) suffix += ALPHABET[randomInt(ALPHABET.length)];
  return `SH-${stamp}-${suffix}`;
}
