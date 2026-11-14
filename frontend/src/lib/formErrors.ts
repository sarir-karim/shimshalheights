import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { ApiError } from "@/lib/adminApi";

/** Maps the API's `errors: [{ field, message }]` onto the matching form fields. Returns true if any were applied. */
export function applyFieldErrors<T extends FieldValues>(err: unknown, setError: UseFormSetError<T>): boolean {
  if (!(err instanceof ApiError) || err.fieldErrors.length === 0) return false;
  for (const { field, message } of err.fieldErrors) setError(field as Path<T>, { type: "server", message });
  return true;
}
