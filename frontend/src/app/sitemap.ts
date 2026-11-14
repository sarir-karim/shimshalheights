import type { MetadataRoute } from "next";
import { siteUrl } from "@/config/site";
import { getRooms } from "@/services/dataService";

// Rendered per request so new rooms are listed straight away. The room list itself comes from the cached,
// instantly-refreshed API data, so this stays cheap.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = ["", "/rooms", "/restaurant", "/facilities", "/gallery", "/about", "/contact", "/booking"];
  const rooms = await getRooms().catch(() => []); // API unreachable at build time: static pages only
  return [
    ...staticRoutes.map((path) => ({ url: `${siteUrl}${path}`, changeFrequency: "weekly" as const, priority: path === "" ? 1 : 0.7 })),
    ...rooms.map((room) => ({ url: `${siteUrl}/rooms/${room.slug}`, changeFrequency: "weekly" as const, priority: 0.6 })),
  ];
}
