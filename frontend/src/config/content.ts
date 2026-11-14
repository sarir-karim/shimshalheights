import type { Facility, GalleryCategory } from "@/types";

/**
 * Editorial content that is not managed in the admin (the brief has no model for it).
 * Photos for these blocks are taken from the admin-managed gallery by category, with a neutral fallback.
 */
export const facilityContent: (Omit<Facility, "image"> & { categories: GalleryCategory[] })[] = [
  { id: "f1", icon: "rooms", title: "Comfortable Accommodation", description: "Warm, clean rooms with private bathrooms and heating for cold mountain nights.", details: ["Private bathrooms", "Heating", "Clean linen"], categories: ["Rooms"] },
  { id: "f2", icon: "restaurant", title: "Restaurant", description: "Freshly prepared meals in an on-site dining room, from breakfast to dinner.", details: ["Breakfast, lunch and dinner", "Vegetarian options"], categories: ["Restaurant", "Food"] },
  { id: "f3", icon: "room-service", title: "Room Service", description: "Meals and hot drinks brought to your room when you would rather stay in.", details: ["Meals to your room", "Hot drinks"], categories: ["Food", "Restaurant"] },
  { id: "f4", icon: "parking", title: "Parking", description: "Parking for guests arriving by car or jeep, right at the hotel.", details: ["On-site parking", "Ask about larger vehicles"], categories: ["Hotel Exterior"] },
  { id: "f5", icon: "views", title: "Mountain Views", description: "Rooms and terraces that look out over the ridgelines of Shimshal.", details: ["Valley-facing rooms", "Sunrise and sunset light"], categories: ["Mountains & Nature", "Shimshal Valley"] },
  { id: "f6", icon: "support", title: "Guest Support", description: "Friendly help with directions, local advice and planning your stay.", details: ["Local advice", "Help with arrival and directions"], categories: ["Shimshal Valley", "Hotel Exterior"] },
];

export const experienceContent: { id: string; title: string; description: string; categories: GalleryCategory[] }[] = [
  { id: "e1", title: "Mountain scenery", description: "Glaciated peaks and high pastures surround the valley.", categories: ["Mountains & Nature"] },
  { id: "e2", title: "Trekking and adventure", description: "Shimshal is known as a base for demanding treks and expeditions.", categories: ["Shimshal Valley", "Mountains & Nature"] },
  { id: "e3", title: "Local culture", description: "A close-knit mountain community with its own traditions.", categories: ["Shimshal Valley"] },
  { id: "e4", title: "Nearby attractions", description: "Pastures, viewpoints and glaciers within reach of the hotel.", categories: ["Mountains & Nature", "Shimshal Valley"] },
];

export const placeholders = {
  room: { url: "/images/demo/placeholder-room.svg", alt: "Photo coming soon" },
  food: { url: "/images/demo/placeholder-food.svg", alt: "Photo coming soon" },
  generic: { url: "/images/demo/placeholder.svg", alt: "Photo coming soon" },
};

/**
 * About page copy that only the hotel can write (founding story, philosophy). Leave empty until real text exists:
 * in production the sections stay hidden; in demo mode a clearly marked draft is shown instead.
 */
export const aboutContent = { story: "", philosophy: "" };
export const aboutDraft = {
  story: "Draft copy: the hotel's founding story, the people behind it and its connection to Shimshal will be written with the owners and replace this paragraph.",
  philosophy: "Draft copy: honest, warm and unhurried service. Guests are welcomed as visitors to a community, not processed as bookings.",
};
