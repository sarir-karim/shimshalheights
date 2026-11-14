import type { SiteSettings } from "@/types";

/**
 * Central hotel configuration. This is the single source for hotel details on the public site.
 * In Step 6 it is replaced by GET /api/settings (Hotel Settings model), keeping the same shape.
 * All contact values below are PLACEHOLDERS until the hotel supplies real details.
 */
export const siteSettings: SiteSettings = {
  name: "Shimshal Heights",
  tagline: "Mountain hospitality in Upper Hunza",
  description:
    "Shimshal Heights is a mountain hotel in Shimshal Valley, Upper Hunza, Gilgit-Baltistan, offering comfortable rooms, an on-site restaurant, room service and parking for trekkers, families and travellers.",
  address: "Shimshal Valley, Upper Hunza, Gilgit-Baltistan, Pakistan",
  phone: "+92 000 0000000", // placeholder
  whatsapp: "920000000000", // placeholder
  email: "info@example.com", // placeholder
  checkInTime: "14:00", // placeholder
  checkOutTime: "11:00", // placeholder
  social: { facebook: "#", instagram: "#" }, // placeholders
  mapsDirectionsUrl: "https://www.google.com/maps/search/?api=1&query=Shimshal+Valley+Gilgit-Baltistan",
  mapsEmbedUrl: "",
  bookingPolicies: "",
  cancellationPolicies: "",
  seoTitle: "",
  seoDescription: "",
  logoUrl: "",
  demoMode: process.env.NEXT_PUBLIC_DEMO_MODE !== "false",
};

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const navLinks = [
  { label: "Home", href: "/" },
  { label: "Rooms & Suites", href: "/rooms" },
  { label: "Restaurant", href: "/restaurant" },
  { label: "Facilities", href: "/facilities" },
  { label: "Gallery", href: "/gallery" },
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

/** Backend base URL, used only by server-side data fetching. */
export const backendUrl = process.env.BACKEND_URL ?? "http://localhost:5000";
/** Offline development: serve the built-in demo data instead of calling the API. */
export const useMockData = process.env.NEXT_PUBLIC_USE_MOCK === "true";
