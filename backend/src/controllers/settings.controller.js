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
