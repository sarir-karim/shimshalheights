import { placeholders } from "@/config/content";
import { siteSettings as defaults } from "@/config/site";
import type { AdminMenuItem, GalleryRecord, RestaurantDoc, SettingsDoc, TestimonialRecord, AdminRoom } from "@/types/admin";
import type { GalleryImage, MenuItem, RestaurantInfo, Room, SiteImage, SiteSettings, Testimonial } from "@/types";

/** Converts API documents into the shapes the UI components already use. */
export function mapRoom(r: AdminRoom): Room {
  const images: SiteImage[] = r.images.length > 0 ? r.images.map((i) => ({ url: i.url, publicId: i.publicId, alt: i.alt || r.name })) : [placeholders.room];
  return { id: r.id, slug: r.slug, name: r.name, shortDescription: r.shortDescription, description: r.description, pricePerNight: r.pricePerNight, roomType: r.roomType, maxAdults: r.maxAdults, maxChildren: r.maxChildren, totalRooms: r.totalRooms, bedConfiguration: r.bedConfiguration, amenities: r.amenities, images, featured: r.featured, isActive: r.isActive };
}

export const mapGallery = (g: GalleryRecord): GalleryImage => ({
  id: g.id, title: g.title, category: g.category, description: g.description, isFeatured: g.isFeatured,
  image: { url: g.imageUrl, publicId: g.cloudinaryPublicId, alt: g.description || g.title },
});

export const mapTestimonial = (t: TestimonialRecord): Testimonial => ({ id: t.id, guestName: t.guestName, guestLocation: t.guestLocation, rating: t.rating, review: t.review, isFeatured: t.isFeatured });

export const mapMenuItem = (m: AdminMenuItem): MenuItem => ({
  id: m.id, name: m.name, description: m.description, categoryId: m.category, price: m.price, dietary: m.dietaryInformation, isAvailable: m.isAvailable,
  image: m.image ? { url: m.image.url, publicId: m.image.publicId, alt: m.image.alt || m.name } : undefined,
});

export const mapRestaurant = (r: RestaurantDoc): RestaurantInfo => ({
  name: r.name, description: r.description, openingHours: r.openingHours, facilities: r.facilities,
  images: r.images.map((i) => ({ url: i.url, publicId: i.publicId, alt: i.alt || r.name })),
  categories: [...r.menuCategories].sort((a, b) => a.order - b.order).map((c) => ({ id: c.id, name: c.name })),
});

/**
 * Hotel settings from the API. Values the hotel has not entered yet fall back to the clearly marked
 * placeholders only while demo mode is on; in production an empty value simply hides that control.
 */
export function mapSettings(raw: SettingsDoc | null): SiteSettings {
  const demo = defaults.demoMode;
  const text = (v: string | undefined, fallback: string) => (v && v.trim() ? v.trim() : demo ? fallback : "");
  return {
    name: raw?.hotelName?.trim() || defaults.name,
    tagline: defaults.tagline,
    description: raw?.description?.trim() || defaults.description,
    address: raw?.address?.trim() || defaults.address,
    phone: text(raw?.contactNumbers?.[0], defaults.phone),
    whatsapp: text(raw?.whatsappNumber, defaults.whatsapp),
    email: text(raw?.email, defaults.email),
    checkInTime: raw?.checkInTime || defaults.checkInTime,
    checkOutTime: raw?.checkOutTime || defaults.checkOutTime,
    social: { facebook: text(raw?.socialLinks?.facebook, "#"), instagram: text(raw?.socialLinks?.instagram, "#") },
    mapsDirectionsUrl: raw?.googleMapsUrl?.trim() || defaults.mapsDirectionsUrl,
    mapsEmbedUrl: raw?.googleMapsEmbedUrl?.trim() ?? "",
    bookingPolicies: raw?.bookingPolicies ?? "",
    cancellationPolicies: raw?.cancellationPolicies ?? "",
    seoTitle: raw?.seo?.title ?? "",
    seoDescription: raw?.seo?.description ?? "",
    logoUrl: raw?.logo?.url ?? "",
    demoMode: demo,
  };
}
