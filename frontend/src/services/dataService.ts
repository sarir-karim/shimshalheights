import { cache } from "react";
import { experienceContent, facilityContent, placeholders } from "@/config/content";
import { useMockData } from "@/config/site";
import { ApiError } from "@/lib/adminApi";
import { mapGallery, mapMenuItem, mapRestaurant, mapRoom, mapSettings, mapTestimonial } from "@/lib/mappers";
import { apiGet } from "@/lib/serverApi";
import * as mock from "@/services/mockData";
import type { AdminMenuItem, AdminRoom, GalleryRecord, RestaurantDoc, SettingsDoc, TestimonialRecord } from "@/types/admin";
import type { ExperienceItem, Facility, GalleryCategory, GalleryImage, MenuHighlight, MenuItem, RestaurantInfo, Room, SiteImage, SiteSettings, Testimonial } from "@/types";

/**
 * The single data layer for the public website. Pages and sections call only these functions.
 *  - Real mode (default): reads the Express API (server side, cached 60s, refreshed instantly on admin edits).
 *  - Mock mode (NEXT_PUBLIC_USE_MOCK=true): serves the built-in demo data, for working without the backend.
 * Core content (rooms) fails loudly so the error page shows; optional content degrades to empty and the page still renders.
 */
async function optional<T>(load: () => Promise<T>, fallback: T): Promise<T> {
  try { return await load(); } catch (err) { console.warn("[data] optional content unavailable:", err instanceof Error ? err.message : err); return fallback; }
}

// React cache() de-duplicates the settings call across layout, metadata and components within one request.
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  if (useMockData) return mock.mockSettings();
  return mapSettings(await optional(async () => (await apiGet<SettingsDoc>("/settings")).data, null));
});

export async function getRooms(): Promise<Room[]> {
  if (useMockData) return mock.mockGetRooms();
  return (await apiGet<AdminRoom[]>("/rooms?limit=100&sort=price-asc")).data.map(mapRoom);
}

export async function getFeaturedRooms(): Promise<Room[]> {
  if (useMockData) return mock.mockGetFeaturedRooms();
  const featured = (await apiGet<AdminRoom[]>("/rooms?featured=true&limit=6&sort=price-asc")).data.map(mapRoom);
  return featured.length ? featured : (await getRooms()).slice(0, 3); // nothing featured yet: show the first rooms instead of an empty section
}

export async function getRoomBySlug(slug: string): Promise<Room | undefined> {
  if (useMockData) return mock.mockGetRoomBySlug(slug);
  try {
    return mapRoom((await apiGet<AdminRoom>(`/rooms/${encodeURIComponent(slug)}`)).data);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return undefined;
    throw err;
  }
}

export const getGalleryImages = cache(async (): Promise<GalleryImage[]> => {
  if (useMockData) return mock.mockGetGalleryImages();
  return optional(async () => (await apiGet<GalleryRecord[]>("/gallery?limit=100")).data.map(mapGallery), []);
});

export async function getFeaturedGalleryImages(): Promise<GalleryImage[]> {
  if (useMockData) return mock.mockGetFeaturedGalleryImages();
  const all = await getGalleryImages();
  const featured = all.filter((g) => g.isFeatured);
  return (featured.length ? featured : all).slice(0, 5);
}

export async function getTestimonials(): Promise<Testimonial[]> {
  if (useMockData) return mock.mockGetTestimonials();
  return optional(async () => (await apiGet<TestimonialRecord[]>("/testimonials?limit=3")).data.map(mapTestimonial), []);
}

const emptyRestaurant: RestaurantInfo = { name: "Restaurant", description: "", openingHours: [], facilities: [], images: [], categories: [] };

export const getRestaurant = cache(async (): Promise<RestaurantInfo> => {
  if (useMockData) return mock.mockGetRestaurant();
  return optional(async () => mapRestaurant((await apiGet<RestaurantDoc>("/restaurant")).data), emptyRestaurant);
});

export const getMenuItems = cache(async (): Promise<MenuItem[]> => {
  if (useMockData) return mock.mockGetMenuItems();
  return optional(async () => (await apiGet<AdminMenuItem[]>("/menu?limit=100")).data.map(mapMenuItem), []);
});

export async function getMenuHighlights(): Promise<MenuHighlight[]> {
  if (useMockData) return mock.mockGetMenuHighlights();
  const items = (await getMenuItems()).filter((m) => m.isAvailable);
  const ranked = [...items.filter((m) => m.image), ...items.filter((m) => !m.image)].slice(0, 3);
  return ranked.map((m) => ({ id: m.id, name: m.name, description: m.description, dietary: m.dietary, image: m.image ?? placeholders.food }));
}

const pick = (gallery: GalleryImage[], categories: GalleryCategory[], fallback: SiteImage): SiteImage => {
  for (const c of categories) { const hit = gallery.find((g) => g.category === c); if (hit) return hit.image; }
  return fallback;
};

export async function getFacilities(): Promise<Facility[]> {
  if (useMockData) return mock.mockGetFacilities();
  const gallery = await getGalleryImages();
  return facilityContent.map(({ categories, ...f }) => ({ ...f, image: pick(gallery, categories, placeholders.generic) }));
}

export async function getExperiences(): Promise<ExperienceItem[]> {
  if (useMockData) return mock.mockGetExperiences();
  const gallery = await getGalleryImages();
  const used = new Set<string>();
  return experienceContent.map(({ categories, ...e }) => {
    // Prefer a photo not already used by an earlier block so the grid does not repeat one picture.
    const candidates = gallery.filter((g) => categories.includes(g.category));
    const fresh = candidates.find((g) => !used.has(g.id)) ?? candidates[0];
    if (fresh) used.add(fresh.id);
    return { ...e, image: fresh?.image ?? placeholders.generic };
  });
}

export interface SiteImages { hero: SiteImage; about: SiteImage; aboutSecondary: SiteImage; cta: SiteImage; map: SiteImage }

/** Big page images (hero, about, call-to-action) come from the gallery; neutral artwork fills in until photos are uploaded. */
export async function getSiteImages(): Promise<SiteImages> {
  const local = (file: string, alt: string): SiteImage => ({ url: `/images/demo/${file}.svg`, alt });
  if (useMockData) {
    return { hero: local("hero-valley", "Demo image of the mountains above Shimshal Valley"), about: local("about-valley", "Demo image of mountains near the hotel"), aboutSecondary: local("gallery-exterior", "Demo image of the hotel exterior"), cta: local("cta-valley", ""), map: local("map-bg", "Map placeholder") };
  }
  const g = await getGalleryImages();
  const scenic = (cats: GalleryCategory[], skip: number, fallback: SiteImage) => {
    const matches = g.filter((i) => cats.includes(i.category));
    return matches[skip]?.image ?? matches[0]?.image ?? fallback;
  };
  return {
    hero: scenic(["Mountains & Nature", "Shimshal Valley", "Hotel Exterior"], 0, local("fallback-hero", "Mountains above Shimshal Valley")),
    about: scenic(["Shimshal Valley", "Mountains & Nature"], 0, local("fallback-about", "Shimshal Valley")),
    aboutSecondary: scenic(["Hotel Exterior", "Rooms"], 0, local("fallback-about-2", "The hotel")),
    cta: scenic(["Mountains & Nature", "Shimshal Valley"], 1, local("fallback-cta", "")),
    map: local("fallback-map", "Map"),
  };
}

export async function getHomepage(): Promise<Record<string, Record<string, string>>> {
 return optional(async () => (await apiGet<{ homepage?: Record<string, Record<string, string>> }>("/settings")).data.homepage ?? {}, {});
}
