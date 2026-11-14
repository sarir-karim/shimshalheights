import { revalidateService } from "../services/revalidate.service.js";

const SAFE = new Set(["GET", "HEAD", "OPTIONS"]);

/** Mounted on content routers: after a successful write (2xx), ask the website to refresh. */
export function revalidateOnWrite(req, res, next) {
  if (!SAFE.has(req.method)) {
    res.on("finish", () => {
      if (res.statusCode >= 200 && res.statusCode < 300) void revalidateService.notify();
    });
  }
  next();
}
