// Shapes mirror the planned Mongoose models so the mock service can be swapped for the API without touching components.
export interface SiteImage {
  url: string;
  alt: string;
  publicId?: string; // Cloudinary public id (set once admin uploads replace demo art)
}

export interface Room {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  pricePerNight: number;
  roomType: "standard" | "deluxe" | "family" | "suite";
  maxAdults: number;
  maxChildren: number;
  totalRooms: number;
  bedConfiguration: string;
  amenities: string[];
  images: SiteImage[];
  featured: boolean;
  isActive: boolean;
}

export interface Facility {
  id: string;
  title: string;
  description: string;
  icon: "room-service" | "restaurant" | "parking" | "rooms" | "views" | "support";
  image?: SiteImage;
  details?: string[];
}

export interface MenuHighlight {
  id: string;
  name: string;
  description: string;
  dietary: "vegetarian" | "non-vegetarian";
  image: SiteImage;
}

export type GalleryCategory =
  | "Hotel Exterior"
  | "Rooms"
  | "Restaurant"
  | "Food"
  | "Mountains & Nature"
  | "Shimshal Valley";

export interface GalleryImage {
  id: string;
  title: string;
  category: GalleryCategory;
  image: SiteImage;
  description?: string;
  isFeatured: boolean;
}

export interface Testimonial {
  id: string;
  guestName: string;
  guestLocation: string;
  rating: number;
  review: string;
  isFeatured: boolean;
}

export interface ExperienceItem {
  id: string;
  title: string;
  description: string;
  image: SiteImage;
}

export interface SiteSettings {
  name: string;
  tagline: string;
  description: string;
  address: string;
  phone: string;
  whatsapp: string; // digits only, international format
  email: string;
  checkInTime: string;
  checkOutTime: string;
  social: { facebook: string; instagram: string };
  mapsDirectionsUrl: string;
  mapsEmbedUrl: string;
  bookingPolicies: string;
  cancellationPolicies: string;
  seoTitle: string;
  seoDescription: string;
  logoUrl: string;
  demoMode: boolean;
}

export interface MenuCategory {
  id: string;
  name: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  price: number;
  image?: SiteImage;
  dietary: "vegetarian" | "non-vegetarian";
  isAvailable: boolean;
}

export interface RestaurantInfo {
  name: string;
  description: string;
  openingHours: { label: string; hours: string }[];
  facilities: string[];
  images: SiteImage[];
  categories: MenuCategory[];
}
