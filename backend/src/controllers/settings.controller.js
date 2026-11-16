import { z } from "zod";
import { AppError } from "../utils/AppError.js";
import { Settings } from "../models/Settings.js";
import { ok } from "../utils/apiResponse.js";
import { assertSomethingToUpdate } from "../utils/assertUpdate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { toClient } from "../utils/serialize.js";
import { FOLDERS, uploadService } from "../services/upload.service.js";

const getSettingsDoc = () => Settings.findOneAndUpdate({ key: "main" }, { $setOnInsert: { key: "main" } }, { upsert: true, returnDocument: "after" });

export const getSettings = asyncHandler(async (_req, res) => ok(res, toClient(await getSettingsDoc())));

export const updateSettings = asyncHandler(async (req, res) => {
  assertSomethingToUpdate(req);
  const settings = await getSettingsDoc();
  const { removeLogo, socialLinks, seo, ...fields } = req.valid.body;
  const oldLogoId = settings.logo?.publicId;
  const uploaded = req.file ? await uploadService.uploadBuffer(req.file.buffer, FOLDERS.logo) : null;
  try {
    settings.set(fields);
    if (socialLinks) settings.set("socialLinks", { ...settings.socialLinks?.toObject?.(), ...socialLinks });
    if (seo) settings.set("seo", { ...settings.seo?.toObject?.(), ...seo });
    if (uploaded) settings.logo = uploaded;
    else if (removeLogo) settings.logo = undefined;
    await settings.save();
  } catch (err) {
    if (uploaded) await uploadService.destroy(uploaded.publicId);
    throw err;
  }
  if ((uploaded || removeLogo) && oldLogoId) await uploadService.destroy(oldLogoId);
  ok(res, toClient(settings));
});

const sections = new Set(['Hero','AboutPreview','FeaturedRooms','Facilities','RestaurantPreview','ShimshalExperience','GalleryPreview','Testimonials','LocationSection','CallToAction']);
export const saveHomepageSection = asyncHandler(async (req, res) => {
  const section = req.params.section;
  if (!sections.has(section)) throw AppError.badRequest("Unknown homepage section");
  let fields, imageKeys;
  try {
    fields = z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_]{0,79}$/), z.string().max(5000)).parse(JSON.parse(req.body.content));
    imageKeys = z.array(z.string().regex(/^[A-Za-z][A-Za-z0-9_]{0,60}Image$/)).max(10).parse(JSON.parse(req.body.imageKeys || '[]'));
  } catch { throw AppError.badRequest("Invalid homepage content"); }
  if (imageKeys.length !== (req.files || []).length || new Set(imageKeys).size !== imageKeys.length) throw AppError.badRequest("Image fields do not match uploads");
  const uploaded = imageKeys.length ? await uploadService.uploadMany(req.files, 'shimshal-heights/homepage') : [];
  uploaded.forEach((image, i) => { fields[imageKeys[i]] = image.url; });
  try {
    const settings = await Settings.findOneAndUpdate({ key: 'main' }, { $set: { ['homepage.' + section]: fields } }, { upsert: true, returnDocument: 'after', runValidators: true });
    ok(res, toClient(settings));
  } catch (err) { await uploadService.destroyMany(uploaded.map(image => image.publicId)); throw err; }
});
