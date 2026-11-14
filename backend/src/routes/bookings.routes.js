import { Router } from "express";
import { availability, create, getOne, list, updatePayment, updateStatus } from "../controllers/bookings.controller.js";
import { staffOrAdmin } from "../middleware/auth.js";
import { bookingLimiter } from "../middleware/rateLimit.js";
import { validate } from "../middleware/validate.js";
import { idParams } from "../validators/common.js";
import { availabilityQuery, bookingCreateBody, bookingListQuery, bookingPaymentBody, bookingStatusBody } from "../validators/index.js";

const r = Router();
r.post("/", bookingLimiter, validate({ body: bookingCreateBody }), create);
r.get("/availability", validate({ query: availabilityQuery }), availability); // must stay above "/:id"
r.get("/", staffOrAdmin, validate({ query: bookingListQuery }), list);
r.get("/:id", staffOrAdmin, validate({ params: idParams }), getOne);
r.patch("/:id/status", staffOrAdmin, validate({ params: idParams, body: bookingStatusBody }), updateStatus);
r.patch("/:id/payment", staffOrAdmin, validate({ params: idParams, body: bookingPaymentBody }), updatePayment);
export default r;
