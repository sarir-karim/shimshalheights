import { Router } from "express";
import { revalidateOnWrite } from "../middleware/revalidate.js";
import { createGalleryImages, deleteGalleryImage, listGallery, updateGalleryImage } from "../controllers/gallery.controller.js";
import { adminOnly, optionalAuth } from "../middleware/auth.js";
import { uploadMany, uploadOne } from "../middleware/upload.js";
import { validate } from "../middleware/validate.js";
import { idParams } from "../validators/common.js";
import { galleryCreateBody, galleryListQuery, galleryUpdateBody } from "../validators/index.js";

const r = Router();
r.use(revalidateOnWrite);
r.get("/", optionalAuth, validate({ query: galleryListQuery }), listGallery);
r.post("/", adminOnly, uploadMany("images", 10), validate({ body: galleryCreateBody }), createGalleryImages);
r.put("/:id", adminOnly, uploadOne("image"), validate({ params: idParams, body: galleryUpdateBody }), updateGalleryImage);
r.delete("/:id", adminOnly, validate({ params: idParams }), deleteGalleryImage);
export default r;
