import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function readToken(req) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);
  return req.cookies?.[env.COOKIE_NAME];
}

async function loadUser(req) {
  const token = readToken(req);
  if (!token) return null;
  const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] });
  // Re-read the user every request so deactivating an account takes effect immediately.
  const user = await User.findById(payload.sub);
  return user?.isActive ? user : null;
}

/** Requires a valid session. */
export const authenticate = asyncHandler(async (req, _res, next) => {
  const user = await loadUser(req);
  if (!user) throw AppError.unauthorized();
  req.user = user;
  next();
});

/** Attaches req.user when a valid session exists, otherwise continues anonymously (public endpoints with admin extras). */
export const optionalAuth = asyncHandler(async (req, _res, next) => {
  try {
    req.user = (await loadUser(req)) ?? undefined;
  } catch {
    req.user = undefined;
  }
  next();
});

/** Role-based access control: requireRole("admin") or requireRole("admin", "staff"). */
export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user) return next(AppError.unauthorized());
  if (!roles.includes(req.user.role)) return next(AppError.forbidden());
  return next();
};

export const adminOnly = [authenticate, requireRole("admin")];
export const staffOrAdmin = [authenticate, requireRole("admin", "staff")];
