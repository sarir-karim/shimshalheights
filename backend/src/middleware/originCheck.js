import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

const SAFE = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * CSRF defence for cookie auth: state-changing requests that carry an Origin header must come from an allowed frontend.
 * (Requests without Origin, e.g. server-to-server or curl, are not browser-driven CSRF vectors.)
 */
export function originCheck(req, _res, next) {
  if (SAFE.has(req.method)) return next();
  const origin = req.headers.origin;
  if (origin && !env.clientOrigins.includes(origin)) return next(AppError.forbidden("Origin not allowed"));
  return next();
}
