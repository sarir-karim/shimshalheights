import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80, "Name is too long"),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z.string().trim().regex(/^$|^[+()\d\s-]{7,20}$/, "Enter a valid phone number, or leave it empty").optional(),
  subject: z.string().trim().min(3, "Enter a subject").max(120, "Subject is too long"),
  website: z.string().max(200).optional(), // honeypot: hidden from people, filled by bots
  message: z.string().trim().min(10, "Write at least 10 characters").max(2000, "Keep the message under 2000 characters"),
});
export type ContactValues = z.input<typeof contactSchema>;
