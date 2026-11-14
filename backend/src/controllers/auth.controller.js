import bcrypt from "bcrypt";
import { User } from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { ok } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { clearAuthCookie, setAuthCookie, signToken } from "../services/auth.service.js";

/** Explicit allow-list: only these fields are ever sent to the browser. */
const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, isActive: u.isActive });

// Compared against when the email is unknown so response time does not reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 12);

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.valid.body;
  const user = await User.findOne({ email }).select("+password");
  const match = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);
  if (!user || !match || !user.isActive) throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  const token = signToken(user);
  setAuthCookie(res, token);
  ok(res, { user: publicUser(user) });
});

export const logout = asyncHandler(async (_req, res) => {
  clearAuthCookie(res);
  ok(res, { loggedOut: true });
});

export const me = asyncHandler(async (req, res) => ok(res, { user: publicUser(req.user) }));
