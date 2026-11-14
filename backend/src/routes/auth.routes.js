import { Router } from "express";
import { login, logout, me } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.js";
import { loginLimiter } from "../middleware/rateLimit.js";
import { validate } from "../middleware/validate.js";
import { loginBody } from "../validators/index.js";

const r = Router();
r.post("/login", loginLimiter, validate({ body: loginBody }), login);
r.post("/logout", logout);
r.get("/me", authenticate, me);
export default r;
