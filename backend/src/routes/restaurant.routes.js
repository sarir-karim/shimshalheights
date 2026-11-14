import { Router } from "express";
import { revalidateOnWrite } from "../middleware/revalidate.js";
import { getRestaurant, updateRestaurant } from "../controllers/restaurant.controller.js";
import { adminOnly } from "../middleware/auth.js";
import { uploadMany } from "../middleware/upload.js";
import { validate } from "../middleware/validate.js";
import { restaurantUpdateBody } from "../validators/index.js";

const r = Router();
r.use(revalidateOnWrite);
r.get("/", getRestaurant);
r.put("/", adminOnly, uploadMany("images", 10), validate({ body: restaurantUpdateBody }), updateRestaurant);
export default r;
