import { AppError } from "./AppError.js";

/** An update is valid if it changes at least one field OR uploads at least one file. */
export function assertSomethingToUpdate(req) {
  const fields = Object.values(req.valid?.body ?? {}).some((v) => v !== undefined);
  const files = Boolean(req.file) || (Array.isArray(req.files) ? req.files.length > 0 : false);
  if (!fields && !files) throw new AppError("Nothing to update", 422, "VALIDATION_ERROR");
}
