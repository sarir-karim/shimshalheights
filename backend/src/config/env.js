import { allowedOrigins } from "../utils/origins.js";
import "dotenv/config";
import { z } from "zod";

const flag = (def) => z.enum(["true", "false"]).default(def).transform((v) => v === "true");

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().default(5000),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("8h"),
  COOKIE_NAME: z.string().default("sh_token"),
  COOKIE_SECURE: flag("false"),
  COOKIE_SAMESITE: z.enum(["lax", "strict", "none"]).default("lax"),
  CLIENT_ORIGINS: z.string().default("http://localhost:3000"),
  TRUST_PROXY: z.coerce.number().int().default(0),
  HOTEL_TIMEZONE: z.string().default("Asia/Karachi"),
  RATE_LIMIT_ENABLED: flag("true"),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  // Public website hook: after content changes the API asks the site to refresh its cache immediately.
  FRONTEND_REVALIDATE_URL: z.string().url().optional(),
  REVALIDATE_SECRET: z.string().min(16, "REVALIDATE_SECRET must be at least 16 characters").optional(),
  ADMIN_NOTIFY_EMAIL: z.string().optional(),
  ADMIN_NAME: z.string().default("Hotel Admin"),
  ADMIN_EMAIL: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional(),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
  console.error(`Invalid environment configuration:\n${issues}`);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  isProd: parsed.data.NODE_ENV === "production",
  isTest: parsed.data.NODE_ENV === "test",
  clientOrigins: allowedOrigins(parsed.data.CLIENT_ORIGINS, parsed.data.NODE_ENV === "production"),
  cloudinaryConfigured: Boolean(
    parsed.data.CLOUDINARY_CLOUD_NAME && parsed.data.CLOUDINARY_API_KEY && parsed.data.CLOUDINARY_API_SECRET,
  ),
};

if (env.isProd && env.COOKIE_SAMESITE === "none" && !env.COOKIE_SECURE) {
  console.error("COOKIE_SAMESITE=none requires COOKIE_SECURE=true");
  process.exit(1);
}
