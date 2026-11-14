import multer from "multer";
import { AppError } from "../utils/AppError.js";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

const storage = multer.memoryStorage();
const fileFilter = (_req, file, cb) =>
  ALLOWED_MIME.has(file.mimetype) ? cb(null, true) : cb(AppError.badRequest("Only JPEG, PNG, WebP or AVIF images are allowed"));

const base = multer({ storage, fileFilter, limits: { fileSize: MAX_BYTES, files: 10, fields: 40 } });

/** Confirms the bytes really are an image: the client-supplied mimetype alone is not trusted. */
export function looksLikeImage(buf) {
  if (!buf || buf.length < 12) return false;
  const jpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  const png = buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const webp = buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP";
  const avif = buf.subarray(4, 8).toString("ascii") === "ftyp" && /avif|avis/.test(buf.subarray(8, 16).toString("ascii"));
  return jpeg || png || webp || avif;
}

function verifyMagicBytes(req, _res, next) {
  const files = req.file ? [req.file] : Array.isArray(req.files) ? req.files : Object.values(req.files ?? {}).flat();
  for (const file of files) {
    if (!looksLikeImage(file.buffer)) return next(AppError.badRequest(`"${file.originalname}" is not a valid image file`));
  }
  return next();
}

export const uploadMany = (field, max = 10) => [base.array(field, max), verifyMagicBytes];
export const uploadOne = (field) => [base.single(field), verifyMagicBytes];
