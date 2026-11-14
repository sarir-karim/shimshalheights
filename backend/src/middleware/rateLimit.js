import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

const make = (windowMs, limit, message) =>
  env.RATE_LIMIT_ENABLED
    ? rateLimit({
        windowMs,
        limit,
        standardHeaders: "draft-7",
        legacyHeaders: false,
        handler: (_req, res) => res.status(429).json({ success: false, code: "RATE_LIMITED", message }),
      })
    : (_req, _res, next) => next();

export const globalLimiter = make(15 * 60_000, 300, "Too many requests. Please try again shortly.");
export const loginLimiter = make(15 * 60_000, 10, "Too many sign-in attempts. Please try again in 15 minutes.");
export const bookingLimiter = make(60 * 60_000, 20, "Too many booking requests. Please try again later or contact the hotel.");
export const contactLimiter = make(60 * 60_000, 10, "Too many messages. Please try again later.");
