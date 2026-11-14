import mongoose from "mongoose";

/** Converts Mongo documents into client JSON: _id -> id (string), drops __v, recurses into arrays/objects. */
export function toClient(value) {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(toClient);
  if (value instanceof mongoose.Types.ObjectId) return value.toString();
  if (value instanceof Date) return value;
  if (typeof value.toObject === "function") return toClient(value.toObject());
  if (typeof value === "object") {
    const out = {};
    for (const [key, v] of Object.entries(value)) {
      if (key === "__v" || key === "password") continue; // defence in depth: never serialise a password field
      out[key === "_id" ? "id" : key] = toClient(v);
    }
    return out;
  }
  return value;
}
