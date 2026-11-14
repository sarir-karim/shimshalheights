export function slugify(text) {
  return String(text)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "item";
}

/** Returns a slug unique within `Model`, appending -2, -3 … when needed. */
export async function uniqueSlug(Model, base, excludeId) {
  let slug = slugify(base);
  let n = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await Model.exists({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) {
    n += 1;
    slug = `${slugify(base)}-${n}`;
  }
  return slug;
}
