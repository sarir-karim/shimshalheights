import { useMockData } from "@/config/site";
import { api } from "@/lib/adminApi";
import type { ContactValues } from "@/lib/contact";

/** Sends the message to the API (stored for staff in the admin Messages screen and shown in their notifications). */
export async function sendContactMessage(values: ContactValues): Promise<{ ok: true }> {
  if (useMockData) { await new Promise((r) => setTimeout(r, 500)); return { ok: true }; }
  await api("POST", "/contact", { body: { ...values, phone: values.phone ?? "" } });
  return { ok: true };
}
