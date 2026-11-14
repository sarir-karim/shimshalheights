import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

/**
 * Tells the public website to drop its cached content. Fire-and-forget: a slow or offline website must never
 * slow down or fail an admin save. (Without this the site still refreshes on its own every 60 seconds.)
 */
export const revalidateService = {
  enabled: () => Boolean(env.FRONTEND_REVALIDATE_URL && env.REVALIDATE_SECRET),

  async notify() {
    if (!this.enabled()) return;
    try {
      const res = await fetch(env.FRONTEND_REVALIDATE_URL, {
        method: "POST",
        headers: { "x-revalidate-secret": env.REVALIDATE_SECRET },
        signal: AbortSignal.timeout(3000),
      });
      if (!res.ok) logger.warn(`Website revalidation answered ${res.status}`);
    } catch (err) {
      logger.warn(`Website revalidation failed: ${err.message}`);
    }
  },
};
