import { Router } from "express";
import { createMessage, deleteMessage, getMessage, listMessages, updateMessage } from "../controllers/contact.controller.js";
import { staffOrAdmin } from "../middleware/auth.js";
import { contactLimiter } from "../middleware/rateLimit.js";
import { validate } from "../middleware/validate.js";
import { idParams } from "../validators/common.js";
import { contactCreateBody, contactListQuery, contactUpdateBody } from "../validators/index.js";

const r = Router();
r.post("/", contactLimiter, validate({ body: contactCreateBody }), createMessage);
r.get("/", staffOrAdmin, validate({ query: contactListQuery }), listMessages);
r.get("/:id", staffOrAdmin, validate({ params: idParams }), getMessage);
r.patch("/:id", staffOrAdmin, validate({ params: idParams, body: contactUpdateBody }), updateMessage);
r.delete("/:id", staffOrAdmin, validate({ params: idParams }), deleteMessage);
export default r;
