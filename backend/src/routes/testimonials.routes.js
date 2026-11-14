import { Router } from "express";
import { revalidateOnWrite } from "../middleware/revalidate.js";
import { createTestimonial, deleteTestimonial, listTestimonials, updateTestimonial } from "../controllers/testimonials.controller.js";
import { adminOnly, optionalAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { idParams } from "../validators/common.js";
import { testimonialCreateBody, testimonialListQuery, testimonialUpdateBody } from "../validators/index.js";

const r = Router();
r.use(revalidateOnWrite);
r.get("/", optionalAuth, validate({ query: testimonialListQuery }), listTestimonials);
r.post("/", adminOnly, validate({ body: testimonialCreateBody }), createTestimonial);
r.put("/:id", adminOnly, validate({ params: idParams, body: testimonialUpdateBody }), updateTestimonial);
r.delete("/:id", adminOnly, validate({ params: idParams }), deleteTestimonial);
export default r;
