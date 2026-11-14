import { Router } from "express";
import { revalidateOnWrite } from "../middleware/revalidate.js";
import { createRoom, deleteRoom, getRoom, listRooms, updateRoom } from "../controllers/rooms.controller.js";
import { adminOnly, optionalAuth } from "../middleware/auth.js";
import { uploadMany } from "../middleware/upload.js";
import { validate } from "../middleware/validate.js";
import { idParams, slugParams } from "../validators/common.js";
import { roomCreateBody, roomListQuery, roomUpdateBody } from "../validators/index.js";

const r = Router();
r.use(revalidateOnWrite);
r.get("/", optionalAuth, validate({ query: roomListQuery }), listRooms);
r.get("/:slug", optionalAuth, validate({ params: slugParams }), getRoom);
r.post("/", adminOnly, uploadMany("images", 10), validate({ body: roomCreateBody }), createRoom);
r.put("/:id", adminOnly, uploadMany("images", 10), validate({ params: idParams, body: roomUpdateBody }), updateRoom);
r.delete("/:id", adminOnly, validate({ params: idParams }), deleteRoom);
export default r;
