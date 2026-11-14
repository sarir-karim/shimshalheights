import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const signToken = (user) =>
  jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN, algorithm: "HS256" });

const cookieOptions = () => ({
  httpOnly: true, // not readable from JavaScript, so XSS cannot steal the session
  secure: env.COOKIE_SECURE,
  sameSite: env.COOKIE_SAMESITE,
  path: "/",
});

export const setAuthCookie = (res, token) => res.cookie(env.COOKIE_NAME, token, { ...cookieOptions(), maxAge: 8 * 60 * 60 * 1000 });
export const clearAuthCookie = (res) => res.clearCookie(env.COOKIE_NAME, cookieOptions());
