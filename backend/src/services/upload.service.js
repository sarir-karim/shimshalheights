import { cloudinary } from "../config/cloudinary.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";
import { logger } from "../utils/logger.js";

export const FOLDERS = {
  logo: "shimshal-heights/logo",
  rooms: "shimshal-heights/rooms",
  restaurant: "shimshal-heights/restaurant",
  gallery: "shimshal-heights/gallery",
  menu: "shimshal-heights/menu",
};

/**
 * All Cloudinary access goes through this object (server-side only; the API secret never reaches the browser).
 * Controllers call these methods, and tests replace them with fakes.
 */
export const uploadService = {
  assertConfigured() {
    if (!env.cloudinaryConfigured) throw new AppError("Image storage is not configured on the server", 503, "STORAGE_NOT_CONFIGURED");
  },

  async uploadBuffer(buffer, folder) {
    this.assertConfigured();
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder, resource_type: "image" }, (err, result) =>
        err || !result ? reject(err ?? new Error("Upload failed")) : resolve({ url: result.secure_url, publicId: result.public_id }),
      );
      stream.end(buffer);
    });
  },

  /** Uploads several files; if any fails, the ones already uploaded are removed so nothing is orphaned. */
  async uploadMany(files, folder) {
    this.assertConfigured();
    const settled = await Promise.allSettled(files.map((f) => this.uploadBuffer(f.buffer, folder)));
    const uploaded = settled.filter((s) => s.status === "fulfilled").map((s) => s.value);
    if (uploaded.length !== files.length) {
      await this.destroyMany(uploaded.map((u) => u.publicId));
      throw new AppError("One or more images failed to upload. Please try again.", 502, "UPLOAD_FAILED");
    }
    return uploaded;
  },

  async destroy(publicId) {
    if (!publicId || !env.cloudinaryConfigured) return;
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: "image", invalidate: true });
    } catch (err) {
      logger.error(`Could not delete Cloudinary image ${publicId}:`, err.message);
    }
  },

  async destroyMany(publicIds) {
    await Promise.all(publicIds.filter(Boolean).map((id) => this.destroy(id)));
  },
};
