import { Router } from "express";
import { revalidateOnWrite } from "../middleware/revalidate.js";
import { getSettings, updateSettings } from "../controllers/settings.controller.js";
import { adminOnly } from "../middleware/auth.js";
import { uploadOne } from "../middleware/upload.js";
import { validate } from "../middleware/validate.js";
import { settingsUpdateBody } from "../validators/index.js";

const r = Router();
r.use(revalidateOnWrite);
r.get("/", getSettings);
r.put("/", adminOnly, uploadOne("logo"), validate({ body: settingsUpdateBody }), updateSettings);
export default r;
