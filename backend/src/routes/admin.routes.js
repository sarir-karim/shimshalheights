import { Router } from "express";
import { listNotifications, markAllNotificationsRead, markNotificationRead, stats } from "../controllers/admin.controller.js";
import { staffOrAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { idParams } from "../validators/common.js";

const r = Router();
r.use(staffOrAdmin);
r.get("/stats", stats);
r.get("/notifications", listNotifications);
r.patch("/notifications/read-all", markAllNotificationsRead); // above "/:id"
r.patch("/notifications/:id/read", validate({ params: idParams }), markNotificationRead);
export default r;
