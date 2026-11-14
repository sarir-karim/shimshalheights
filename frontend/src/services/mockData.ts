import { siteSettings } from "@/config/site";
import { experiences, extraGalleryImages, facilities, facilityPhotos, galleryImages, menuHighlights, menuItems, restaurantInfo, rooms, testimonials } from "@/data/mock";
import type { ExperienceItem, Facility, GalleryImage, MenuHighlight, MenuItem, RestaurantInfo, Room, SiteSettings, Testimonial } from "@/types";

/**
 * Frontend data service. Every page and section reads data through these functions only.
 * Today they return mock data; in Step 6 each body becomes a fetch() to the Express API
 * (e.g. `GET ${NEXT_PUBLIC_API_URL}/rooms?featured=true`) and no component needs to change.
 */
export async function mockSettings(): Promise<SiteSettings> {
  return siteSettings;
}

export async function mockGetRooms(): Promise<Room[]> {
  return rooms.filter((room) => room.isActive);
}

export async function mockGetFeaturedRooms(): Promise<Room[]> {
  return rooms.filter((room) => room.isActive && room.featured);
}

export async function mockGetRoomBySlug(slug: string): Promise<Room | undefined> {
  return rooms.find((room) => room.slug === slug && room.isActive);
}

export async function mockGetFacilities(): Promise<Facility[]> {
  return facilities.map((f) => ({ ...f, ...facilityPhotos[f.id] }));
}

export async function mockGetMenuHighlights(): Promise<MenuHighlight[]> {
  return menuHighlights;
}

export async function mockGetExperiences(): Promise<ExperienceItem[]> {
  return experiences;
}

export async function mockGetFeaturedGalleryImages(): Promise<GalleryImage[]> {
  return galleryImages.filter((item) => item.isFeatured);
}

export async function mockGetGalleryImages(): Promise<GalleryImage[]> {
  return [...galleryImages, ...extraGalleryImages];
}

export async function mockGetTestimonials(): Promise<Testimonial[]> {
  return testimonials;
}

export async function mockGetRestaurant(): Promise<RestaurantInfo> {
  return restaurantInfo;
}

export async function mockGetMenuItems(): Promise<MenuItem[]> {
  return menuItems;
}
