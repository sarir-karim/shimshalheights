import { Router } from "express";
import { revalidateOnWrite } from "../middleware/revalidate.js";
import { createMenuItem, deleteMenuItem, listMenu, updateMenuItem } from "../controllers/restaurant.controller.js";
import { adminOnly } from "../middleware/auth.js";
import { uploadOne } from "../middleware/upload.js";
import { validate } from "../middleware/validate.js";
import { idParams } from "../validators/common.js";
import { menuCreateBody, menuListQuery, menuUpdateBody } from "../validators/index.js";

const r = Router();
r.use(revalidateOnWrite);
r.get("/", validate({ query: menuListQuery }), listMenu);
r.post("/", adminOnly, uploadOne("image"), validate({ body: menuCreateBody }), createMenuItem);
r.put("/:id", adminOnly, uploadOne("image"), validate({ params: idParams, body: menuUpdateBody }), updateMenuItem);
r.delete("/:id", adminOnly, validate({ params: idParams }), deleteMenuItem);
export default r;
