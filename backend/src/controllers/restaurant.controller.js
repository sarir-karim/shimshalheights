import { MenuItem } from "../models/MenuItem.js";
import { Restaurant } from "../models/Restaurant.js";
import { AppError } from "../utils/AppError.js";
import { assertSomethingToUpdate } from "../utils/assertUpdate.js";
import { ok } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { pageMeta, paginate } from "../utils/pagination.js";
import { toClient } from "../utils/serialize.js";
import { FOLDERS, uploadService } from "../services/upload.service.js";

async function getRestaurantDoc() {
  return (await Restaurant.findOne()) ?? Restaurant.create({});
}

export const getRestaurant = asyncHandler(async (_req, res) => ok(res, toClient(await getRestaurantDoc())));

export const updateRestaurant = asyncHandler(async (req, res) => {
  assertSomethingToUpdate(req);
  const restaurant = await getRestaurantDoc();
  const { menuCategories, removeImages = [], ...fields } = req.valid.body;

  if (menuCategories) {
    const incomingIds = new Set(menuCategories.filter((c) => c.id).map((c) => c.id));
    for (const existing of restaurant.menuCategories) {
      if (!incomingIds.has(String(existing._id)) && (await MenuItem.exists({ category: existing._id }))) {
        throw AppError.conflict(`Category "${existing.name}" still has menu items. Move or delete them first.`, "CATEGORY_IN_USE");
      }
    }
    const known = new Map(restaurant.menuCategories.map((c) => [String(c._id), c]));
    restaurant.menuCategories = menuCategories.map((c, i) => {
      if (c.id && !known.has(c.id)) throw AppError.badRequest(`Unknown category id ${c.id}`);
      return { ...(c.id ? { _id: c.id } : {}), name: c.name, order: c.order ?? i };
    });
  }

  const files = req.files ?? [];
  const uploaded = files.length ? await uploadService.uploadMany(files, FOLDERS.restaurant) : [];
  const toDelete = restaurant.images.filter((i) => removeImages.includes(i.publicId)).map((i) => i.publicId);
  try {
    restaurant.set(fields);
    restaurant.images = [...restaurant.images.filter((i) => !toDelete.includes(i.publicId)), ...uploaded.map((u) => ({ ...u, alt: restaurant.name }))];
    await restaurant.save();
  } catch (err) {
    await uploadService.destroyMany(uploaded.map((u) => u.publicId));
    throw err;
  }
  await uploadService.destroyMany(toDelete);
  ok(res, toClient(restaurant));
});

export const listMenu = asyncHandler(async (req, res) => {
  const q = req.valid.query;
  const filter = q.category ? { category: q.category } : {};
  const p = paginate(q);
  const [items, total] = await Promise.all([
    MenuItem.find(filter).sort({ category: 1, name: 1 }).skip(p.skip).limit(p.limit).lean(),
    MenuItem.countDocuments(filter),
  ]);
  ok(res, toClient(items), { meta: pageMeta(p, total) });
});

async function assertCategory(categoryId) {
  const restaurant = await getRestaurantDoc();
  if (!restaurant.menuCategories.some((c) => String(c._id) === String(categoryId))) throw AppError.badRequest("That menu category does not exist");
}

export const createMenuItem = asyncHandler(async (req, res) => {
  const data = req.valid.body;
  await assertCategory(data.category);
  const uploaded = req.file ? await uploadService.uploadBuffer(req.file.buffer, FOLDERS.menu) : null;
  try {
    const item = await MenuItem.create({ ...data, ...(uploaded ? { image: { ...uploaded, alt: data.name } } : {}) });
    ok(res, toClient(item), { status: 201 });
  } catch (err) {
    if (uploaded) await uploadService.destroy(uploaded.publicId);
    throw err;
  }
});

export const updateMenuItem = asyncHandler(async (req, res) => {
  assertSomethingToUpdate(req);
  const item = await MenuItem.findById(req.valid.params.id);
  if (!item) throw AppError.notFound("Menu item not found");
  const { removeImage, ...fields } = req.valid.body;
  if (fields.category) await assertCategory(fields.category);

  const oldPublicId = item.image?.publicId;
  const uploaded = req.file ? await uploadService.uploadBuffer(req.file.buffer, FOLDERS.menu) : null;
  try {
    item.set(fields);
    if (uploaded) item.image = { ...uploaded, alt: item.name };
    else if (removeImage) item.image = undefined;
    await item.save();
  } catch (err) {
    if (uploaded) await uploadService.destroy(uploaded.publicId);
    throw err;
  }
  if ((uploaded || removeImage) && oldPublicId) await uploadService.destroy(oldPublicId);
  ok(res, toClient(item));
});

export const deleteMenuItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.findByIdAndDelete(req.valid.params.id);
  if (!item) throw AppError.notFound("Menu item not found");
  await uploadService.destroy(item.image?.publicId);
  ok(res, { deleted: true });
});
