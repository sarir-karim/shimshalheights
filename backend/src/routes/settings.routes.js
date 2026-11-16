import { Router } from "express";
import { revalidateOnWrite } from "../middleware/revalidate.js";
import { saveHomepageSection, getSettings, updateSettings } from "../controllers/settings.controller.js";
import { adminOnly } from "../middleware/auth.js";
import { uploadOne, uploadMany } from "../middleware/upload.js";
import { validate } from "../middleware/validate.js";
import { settingsUpdateBody } from "../validators/index.js";

const r = Router();
r.use(revalidateOnWrite);
r.get("/", getSettings);
r.put("/homepage/:section", adminOnly, uploadMany("images"), saveHomepageSection);
r.put("/", adminOnly, uploadOne("logo"), validate({ body: settingsUpdateBody }), updateSettings);
export default r;
