import { z } from "zod";
import { isISODate } from "../utils/dates.js";

/** Plain-language default messages for every schema (schemas that set their own message keep it). */
z.config({
  customError: (iss) => {
    if (iss.code === "invalid_type") return iss.input === undefined ? "This field is required" : "Invalid value";
    if (iss.code === "too_small" && iss.origin === "string") return iss.minimum === 1 ? "This field is required" : `Must be at least ${iss.minimum} characters`;
    if (iss.code === "too_big" && iss.origin === "string") return `Must be at most ${iss.maximum} characters`;
    if (iss.code === "too_small" && iss.origin === "number") return `Must be at least ${iss.minimum}`;
    if (iss.code === "too_big" && iss.origin === "number") return `Must be at most ${iss.maximum}`;
    if (iss.code === "too_big" && iss.origin === "array") return `Choose at most ${iss.maximum} items`;
    if (iss.code === "invalid_value") return "Choose one of the allowed options";
    return undefined;
  },
});

export const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");
export const idParams = z.object({ id: objectId });
export const slugParams = z.object({ slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]{1,100}$/, "Invalid slug") });

export const isoDate = z.string().refine(isISODate, "Use a valid date in YYYY-MM-DD format");
export const emailField = z.string().trim().toLowerCase().email("Enter a valid email address").max(120);
export const phoneField = z.string().trim().regex(/^[+()\d\s-]{7,20}$/, "Enter a valid phone number");

/** Multipart forms send everything as strings, so booleans/lists/objects are coerced from "true", "a,b" or JSON. */
export const boolish = z.preprocess((v) => (v === "true" ? true : v === "false" ? false : v), z.boolean());
const parseJsonish = (v) => {
  if (typeof v !== "string") return v;
  try { return JSON.parse(v); } catch { return v; }
};
export const listOf = (item) =>
  z.preprocess((v) => {
    const parsed = parseJsonish(v);
    if (typeof parsed === "string") return parsed.split(",").map((s) => s.trim()).filter(Boolean);
    return parsed;
  }, z.array(item));
export const jsonObject = (shape) => z.preprocess(parseJsonish, shape);

export const pageQuery = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

export const allFlag = z.preprocess((v) => v === "true" || v === true, z.boolean()).default(false);
export const optionalBool = z.preprocess((v) => (v === "true" ? true : v === "false" ? false : v), z.boolean().optional());
export const urlOrEmpty = z.string().trim().max(500).refine((v) => v === "" || /^https?:\/\//i.test(v), "Must start with http:// or https://");

/** Rejects an empty update. Apply to PATCH/PUT schemas. */
export const atLeastOne = (obj) => Object.values(obj).some((v) => v !== undefined);
