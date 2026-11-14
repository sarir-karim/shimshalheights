import { Testimonial } from "../models/Testimonial.js";
import { AppError } from "../utils/AppError.js";
import { ok } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { pageMeta, paginate } from "../utils/pagination.js";
import { toClient } from "../utils/serialize.js";

export const listTestimonials = asyncHandler(async (req, res) => {
  const q = req.valid.query;
  const filter = {};
  if (!(q.all && req.user)) filter.isPublished = true; // unpublished reviews are never public
  if (q.featured !== undefined) filter.isFeatured = q.featured;
  const p = paginate(q);
  const [items, total] = await Promise.all([
    Testimonial.find(filter).sort({ isFeatured: -1, createdAt: -1 }).skip(p.skip).limit(p.limit).lean(),
    Testimonial.countDocuments(filter),
  ]);
  ok(res, toClient(items), { meta: pageMeta(p, total) });
});

export const createTestimonial = asyncHandler(async (req, res) => ok(res, toClient(await Testimonial.create(req.valid.body)), { status: 201 }));

export const updateTestimonial = asyncHandler(async (req, res) => {
  const item = await Testimonial.findById(req.valid.params.id);
  if (!item) throw AppError.notFound("Testimonial not found");
  item.set(req.valid.body);
  await item.save();
  ok(res, toClient(item));
});

export const deleteTestimonial = asyncHandler(async (req, res) => {
  if (!(await Testimonial.findByIdAndDelete(req.valid.params.id))) throw AppError.notFound("Testimonial not found");
  ok(res, { deleted: true });
});
