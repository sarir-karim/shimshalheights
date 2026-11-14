import type { ExperienceItem, Facility, GalleryImage, MenuHighlight, Room, Testimonial } from "@/types";

/**
 * DEMO DATA ONLY. Room names, prices, capacities, amenities and reviews are placeholders
 * and must be replaced with real hotel information (via the admin panel) before launch.
 */
const img = (file: string, alt: string) => ({ url: `/images/demo/${file}.svg`, alt });

export const rooms: Room[] = [
  {
    id: "r1",
    slug: "mountain-standard-room",
    name: "Mountain Standard Room",
    shortDescription: "A quiet, warm room with a double bed and a window toward the ridgeline.",
    description:
      "A simple, comfortable room for solo travellers and couples. Wake up to valley light, with a warm bed, private bathroom and room for your trekking gear.",
    pricePerNight: 8000,
    roomType: "standard",
    maxAdults: 2,
    maxChildren: 1,
    totalRooms: 6,
    bedConfiguration: "1 double bed",
    amenities: ["Private bathroom", "Heating", "Mountain view", "Room service"],
    images: [img("room-standard", "Demo image of a standard room with a double bed")],
    featured: true,
    isActive: true,
  },
  {
    id: "r2",
    slug: "deluxe-valley-room",
    name: "Deluxe Valley Room",
    shortDescription: "More space, a seating corner and a wide window over the valley.",
    description:
      "A larger room with a seating corner and a wide window facing the valley. A good choice for longer stays after a trek.",
    pricePerNight: 11000,
    roomType: "deluxe",
    maxAdults: 2,
    maxChildren: 2,
    totalRooms: 4,
    bedConfiguration: "1 king bed",
    amenities: ["Private bathroom", "Heating", "Valley view", "Seating area", "Room service"],
    images: [img("room-deluxe", "Demo image of a deluxe valley room")],
    featured: true,
    isActive: true,
  },
  {
    id: "r3",
    slug: "family-room",
    name: "Family Room",
    shortDescription: "Two beds and room for everyone, close to the restaurant.",
    description:
      "A spacious room with two beds for families and small groups, with space for luggage and an easy walk to the restaurant.",
    pricePerNight: 14000,
    roomType: "family",
    maxAdults: 4,
    maxChildren: 2,
    totalRooms: 3,
    bedConfiguration: "2 double beds",
    amenities: ["Private bathroom", "Heating", "Mountain view", "Extra bedding", "Room service"],
    images: [img("room-family", "Demo image of a family room with two beds")],
    featured: true,
    isActive: true,
  },
  {
    id: "r4",
    slug: "heights-suite",
    name: "Heights Suite",
    shortDescription: "Our top-floor suite with a separate sitting area and the best views.",
    description:
      "The best views in the hotel from the top floor, with a separate sitting area and a king bed.",
    pricePerNight: 18000,
    roomType: "suite",
    maxAdults: 3,
    maxChildren: 1,
    totalRooms: 1,
    bedConfiguration: "1 king bed + sofa bed",
    amenities: ["Private bathroom", "Heating", "Panoramic view", "Sitting area", "Room service"],
    images: [img("room-suite", "Demo image of the top-floor suite")],
    featured: false,
    isActive: true,
  },
];

export const facilities: Facility[] = [
  { id: "f1", icon: "rooms", title: "Comfortable Accommodation", description: "Warm, clean rooms with private bathrooms and heating for cold mountain nights." },
  { id: "f2", icon: "restaurant", title: "Restaurant", description: "Freshly prepared meals in an on-site dining room, from breakfast to dinner." },
  { id: "f3", icon: "room-service", title: "Room Service", description: "Meals and hot drinks brought to your room when you would rather stay in." },
  { id: "f4", icon: "parking", title: "Parking", description: "Parking for guests arriving by car or jeep, right at the hotel." },
  { id: "f5", icon: "views", title: "Mountain Views", description: "Rooms and terraces that look out over the ridgelines of Shimshal." },
  { id: "f6", icon: "support", title: "Guest Support", description: "Friendly help with directions, local advice and planning your stay." },
];

export const menuHighlights: MenuHighlight[] = [
  { id: "m1", name: "Sample local dish", description: "Placeholder for a regional specialty prepared from local ingredients.", dietary: "non-vegetarian", image: img("food-1", "Demo image of a plated dish") },
  { id: "m2", name: "Sample vegetarian plate", description: "Placeholder for a seasonal vegetable dish.", dietary: "vegetarian", image: img("food-2", "Demo image of a vegetarian plate") },
  { id: "m3", name: "Sample breakfast", description: "Placeholder for a warm mountain breakfast.", dietary: "vegetarian", image: img("food-3", "Demo image of a breakfast plate") },
];

export const experiences: ExperienceItem[] = [
  { id: "e1", title: "Mountain scenery", description: "Glaciated peaks and high pastures surround the valley.", image: img("exp-peaks", "Demo image of snow peaks above the valley") },
  { id: "e2", title: "Trekking and adventure", description: "Shimshal is known as a base for demanding treks and expeditions.", image: img("exp-trek", "Demo image of a trekking landscape") },
  { id: "e3", title: "Local culture", description: "A close-knit mountain community with its own traditions.", image: img("exp-culture", "Demo image of the valley at dusk") },
  { id: "e4", title: "Nearby attractions", description: "Pastures, viewpoints and glaciers within reach of the hotel.", image: img("exp-attractions", "Demo image of ridgelines") },
];

export const galleryImages: GalleryImage[] = [
  { id: "g1", title: "Hotel at dusk", category: "Hotel Exterior", image: img("gallery-exterior", "Demo image of the hotel exterior at dusk"), isFeatured: true },
  { id: "g2", title: "Valley morning", category: "Shimshal Valley", image: img("gallery-valley-1", "Demo image of Shimshal Valley at midday"), isFeatured: true },
  { id: "g3", title: "Deluxe room", category: "Rooms", image: img("gallery-room-1", "Demo image of a room"), isFeatured: true },
  { id: "g4", title: "Dining room", category: "Restaurant", image: img("restaurant-interior", "Demo image of the restaurant interior"), isFeatured: true },
  { id: "g5", title: "Ridge at first light", category: "Mountains & Nature", image: img("gallery-nature-1", "Demo image of ridges at dawn"), isFeatured: true },
  { id: "g6", title: "Evening meal", category: "Food", image: img("food-1", "Demo image of a dish"), isFeatured: true },
  { id: "g7", title: "Night sky over the peaks", category: "Mountains & Nature", image: img("gallery-nature-2", "Demo image of peaks at night"), isFeatured: false },
  { id: "g8", title: "Valley at dawn", category: "Shimshal Valley", image: img("gallery-valley-2", "Demo image of the valley at dawn"), isFeatured: false },
];

// Sample reviews: clearly placeholders. Do not publish as real guest feedback.
export const testimonials: Testimonial[] = [
  { id: "t1", guestName: "Sample Guest", guestLocation: "Country (demo)", rating: 5, review: "Sample review text. Replace with a real guest review once collected, covering the stay, the food and the welcome.", isFeatured: true },
  { id: "t2", guestName: "Sample Guest", guestLocation: "Country (demo)", rating: 5, review: "Sample review text for layout purposes only.", isFeatured: true },
  { id: "t3", guestName: "Sample Guest", guestLocation: "Country (demo)", rating: 4, review: "Sample review text for layout purposes only.", isFeatured: true },
];

// ---- Restaurant (DEMO: dishes, prices and hours are placeholders) ----
import type { MenuCategory, MenuItem, RestaurantInfo, SiteImage } from "@/types";

const menuCategories: MenuCategory[] = [
  { id: "c1", name: "Breakfast" },
  { id: "c2", name: "Mains" },
  { id: "c3", name: "Soups & Sides" },
  { id: "c4", name: "Hot Drinks" },
];

export const restaurantInfo: RestaurantInfo = {
  name: "Shimshal Heights Restaurant",
  description:
    "A warm dining room for breakfast, lunch and dinner, serving freshly prepared meals to hotel guests and visitors. Meals can also be brought to your room.",
  openingHours: [
    { label: "Breakfast", hours: "07:00 to 10:00 (placeholder)" },
    { label: "Lunch", hours: "12:00 to 15:00 (placeholder)" },
    { label: "Dinner", hours: "18:30 to 21:30 (placeholder)" },
  ],
  facilities: ["Indoor dining room", "Room service", "Vegetarian options", "Group meals on request"],
  images: [
    img("restaurant-interior", "Demo image of the restaurant interior"),
    img("food-1", "Demo image of a plated dish"),
    img("food-2", "Demo image of a vegetarian plate"),
    img("food-3", "Demo image of a breakfast plate"),
  ],
  categories: menuCategories,
};

export const menuItems: MenuItem[] = [
  { id: "i1", categoryId: "c1", name: "Sample breakfast plate", description: "Placeholder: eggs, bread and tea.", price: 900, dietary: "vegetarian", isAvailable: true, image: img("food-3", "Demo breakfast plate") },
  { id: "i2", categoryId: "c1", name: "Sample porridge", description: "Placeholder: warm porridge with dried fruit.", price: 600, dietary: "vegetarian", isAvailable: true },
  { id: "i3", categoryId: "c2", name: "Sample local main", description: "Placeholder for a regional meat dish.", price: 1800, dietary: "non-vegetarian", isAvailable: true, image: img("food-1", "Demo main dish") },
  { id: "i4", categoryId: "c2", name: "Sample vegetable plate", description: "Placeholder for a seasonal vegetable dish with rice.", price: 1400, dietary: "vegetarian", isAvailable: true, image: img("food-2", "Demo vegetarian plate") },
  { id: "i5", categoryId: "c2", name: "Sample chicken dish", description: "Placeholder for a chicken main.", price: 1700, dietary: "non-vegetarian", isAvailable: false },
  { id: "i6", categoryId: "c3", name: "Sample soup", description: "Placeholder: a hot soup for cold evenings.", price: 700, dietary: "vegetarian", isAvailable: true },
  { id: "i7", categoryId: "c3", name: "Sample bread basket", description: "Placeholder: fresh bread.", price: 300, dietary: "vegetarian", isAvailable: true },
  { id: "i8", categoryId: "c4", name: "Sample tea", description: "Placeholder: a pot of hot tea.", price: 250, dietary: "vegetarian", isAvailable: true },
];

// ---- Facility photos and extra gallery items (DEMO art) ----
export const facilityPhotos: Record<string, { image: SiteImage; details: string[] }> = {
  f1: { image: img("room-deluxe", "Demo image of a guest room"), details: ["Private bathrooms", "Heating", "Clean linen"] },
  f2: { image: img("restaurant-interior", "Demo image of the dining room"), details: ["Breakfast, lunch and dinner", "Vegetarian options"] },
  f3: { image: img("food-1", "Demo image of a meal"), details: ["Meals to your room", "Hot drinks"] },
  f4: { image: img("gallery-exterior", "Demo image of the hotel exterior"), details: ["On-site parking", "Ask about larger vehicles"] },
  f5: { image: img("gallery-nature-1", "Demo image of mountain views"), details: ["Valley-facing rooms", "Sunrise and sunset light"] },
  f6: { image: img("gallery-valley-2", "Demo image of the valley"), details: ["Local advice", "Help with arrival and directions"] },
};

export const extraGalleryImages: GalleryImage[] = [
  { id: "g9", title: "Standard room", category: "Rooms", image: img("room-standard", "Demo image of a standard room"), isFeatured: false },
  { id: "g10", title: "Family room", category: "Rooms", image: img("room-family", "Demo image of a family room"), isFeatured: false },
  { id: "g11", title: "Vegetarian plate", category: "Food", image: img("food-2", "Demo image of a vegetarian plate"), isFeatured: false },
  { id: "g12", title: "Breakfast", category: "Food", image: img("food-3", "Demo image of breakfast"), isFeatured: false },
  { id: "g13", title: "Evening ridgeline", category: "Shimshal Valley", image: img("exp-culture", "Demo image of the valley at dusk"), isFeatured: false },
  { id: "g14", title: "Snow peaks", category: "Mountains & Nature", image: img("exp-peaks", "Demo image of snow peaks"), isFeatured: false },
];
