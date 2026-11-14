import { Gallery } from "../models/Gallery.js";
import { AppError } from "../utils/AppError.js";
import { assertSomethingToUpdate } from "../utils/assertUpdate.js";
import { ok } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { pageMeta, paginate } from "../utils/pagination.js";
import { toClient } from "../utils/serialize.js";
import { FOLDERS, uploadService } from "../services/upload.service.js";

export const listGallery = asyncHandler(async (req, res) => {
  const q = req.valid.query;
  const filter = {};
  if (!(q.all && req.user)) filter.isActive = true;
  if (q.category) filter.category = q.category;
  if (q.featured !== undefined) filter.isFeatured = q.featured;
  const p = paginate(q);
  const [items, total] = await Promise.all([
    Gallery.find(filter).sort({ createdAt: -1 }).skip(p.skip).limit(p.limit).lean(),
    Gallery.countDocuments(filter),
  ]);
  ok(res, toClient(items), { meta: pageMeta(p, total) });
});

/** Accepts one or many images. `titles` (JSON array) names them individually; otherwise `title` is numbered. */
export const createGalleryImages = asyncHandler(async (req, res) => {
  const files = req.files ?? [];
  if (files.length === 0) throw AppError.badRequest("Choose at least one image to upload");
  const { title, titles = [], category, description, isFeatured, isActive } = req.valid.body;
  const nameFor = (i, file) => titles[i] ?? (title ? (files.length > 1 ? `${title} ${i + 1}` : title) : file.originalname.replace(/\.[^.]+$/, ""));

  const uploaded = await uploadService.uploadMany(files, FOLDERS.gallery);
  try {
    const docs = await Gallery.insertMany(
      uploaded.map((u, i) => ({ title: nameFor(i, files[i]).slice(0, 120), category, description, isFeatured, isActive, imageUrl: u.url, cloudinaryPublicId: u.publicId })),
    );
    ok(res, toClient(docs), { status: 201 });
  } catch (err) {
    await uploadService.destroyMany(uploaded.map((u) => u.publicId));
    throw err;
  }
});

export const updateGalleryImage = asyncHandler(async (req, res) => {
  assertSomethingToUpdate(req);
  const item = await Gallery.findById(req.valid.params.id);
  if (!item) throw AppError.notFound("Gallery image not found");
  const oldPublicId = item.cloudinaryPublicId;
  const uploaded = req.file ? await uploadService.uploadBuffer(req.file.buffer, FOLDERS.gallery) : null; // optional file = replace the picture
  try {
    item.set(req.valid.body);
    if (uploaded) { item.imageUrl = uploaded.url; item.cloudinaryPublicId = uploaded.publicId; }
    await item.save();
  } catch (err) {
    if (uploaded) await uploadService.destroy(uploaded.publicId);
    throw err;
  }
  if (uploaded) await uploadService.destroy(oldPublicId);
  ok(res, toClient(item));
});

export const deleteGalleryImage = asyncHandler(async (req, res) => {
  const item = await Gallery.findByIdAndDelete(req.valid.params.id);
  if (!item) throw AppError.notFound("Gallery image not found");
  await uploadService.destroy(item.cloudinaryPublicId);
  ok(res, { deleted: true });
});
