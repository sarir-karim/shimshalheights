import { z } from "zod";
import { GALLERY_CATEGORIES } from "../models/Gallery.js";
import { ROOM_TYPES } from "../models/Room.js";
import { BOOKING_STATUSES, PAYMENT_STATUSES } from "../models/Booking.js";
import { MESSAGE_STATUSES } from "../models/ContactMessage.js";
import {
  allFlag, atLeastOne, boolish, emailField, isoDate, jsonObject, listOf, objectId, optionalBool, pageQuery, phoneField, urlOrEmpty,
} from "./common.js";

const str = (max, min = 1) => z.string().trim().min(min).max(max);
const num = (min, max) => z.coerce.number({ error: "Must be a number" }).min(min).max(max);
const int = (min, max) => z.coerce.number({ error: "Must be a number" }).int().min(min).max(max);

// ---------- Auth ----------
export const loginBody = z.object({ email: emailField, password: z.string().min(1).max(200) });

// ---------- Rooms ----------
const roomFields = {
  name: str(100),
  description: str(4000),
  shortDescription: str(240),
  pricePerNight: num(0, 10_000_000),
  roomType: z.enum(ROOM_TYPES),
  maxAdults: int(1, 20),
  maxChildren: int(0, 20),
  totalRooms: int(1, 200),
  bedConfiguration: str(100),
  amenities: listOf(str(60)).pipe(z.array(z.string()).max(30)),
  featured: boolish,
  isActive: boolish,
};
export const roomCreateBody = z.object({
  ...roomFields,
  maxChildren: roomFields.maxChildren.default(0),
  amenities: roomFields.amenities.default([]),
  featured: roomFields.featured.default(false),
  isActive: roomFields.isActive.default(true),
});
export const roomUpdateBody = z
  .object({ ...Object.fromEntries(Object.entries(roomFields).map(([k, v]) => [k, v.optional()])), slug: str(100).regex(/^[a-z0-9-]+$/).optional(), removeImages: listOf(z.string()).optional() })
  ;
export const roomListQuery = z.object({
  ...pageQuery, limit: pageQuery.limit.default(50),
  roomType: z.enum(ROOM_TYPES).optional(),
  featured: optionalBool,
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  guests: z.coerce.number().int().min(1).max(40).optional(),
  sort: z.enum(["price-asc", "price-desc", "capacity", "newest"]).default("price-asc"),
  all: allFlag,
});

// ---------- Bookings ----------
const stay = {
  checkIn: isoDate,
  checkOut: isoDate,
  adults: int(1, 12),
  children: int(0, 12).default(0),
  rooms: int(1, 10).default(1),
};
const checkOrder = (v, ctx) => {
  if (v.checkOut <= v.checkIn) ctx.addIssue({ code: "custom", path: ["checkOut"], message: "Check-out must be after check-in" });
};
export const bookingCreateBody = z
  .object({
    roomSlug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]{1,100}$/),
    ...stay,
    guestName: str(80, 2),
    guestEmail: emailField,
    guestPhone: phoneField,
    specialRequests: z.string().trim().max(500).optional(),
  })
  .superRefine(checkOrder);
export const availabilityQuery = z
  .object({ ...stay, adults: stay.adults.default(1), roomSlug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]{1,100}$/).optional() })
  .superRefine(checkOrder);
export const bookingListQuery = z.object({
  ...pageQuery,
  status: z.enum(BOOKING_STATUSES).optional(),
  paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
  q: z.string().trim().max(80).optional(),
  from: isoDate.optional(), // check-in on or after
  to: isoDate.optional(), // check-in on or before
  sort: z.enum(["newest", "oldest", "checkin-asc", "checkin-desc"]).default("newest"),
});
export const bookingStatusBody = z.object({ status: z.enum(BOOKING_STATUSES), note: z.string().trim().max(500).optional() });
export const bookingPaymentBody = z.object({ paymentStatus: z.enum(PAYMENT_STATUSES) });

// ---------- Restaurant & menu ----------
export const restaurantUpdateBody = z
  .object({
    name: str(120).optional(),
    description: z.string().trim().max(4000).optional(),
    openingHours: listOf(z.object({ label: str(60), hours: str(80) })).optional(),
    facilities: listOf(str(80)).optional(),
    menuCategories: listOf(z.object({ id: objectId.optional(), name: str(60), order: z.coerce.number().int().min(0).max(999).optional() })).optional(),
    removeImages: listOf(z.string()).optional(),
    isActive: boolish.optional(),
  })
  ;
const menuFields = {
  name: str(100),
  description: z.string().trim().max(500),
  category: objectId,
  price: num(0, 1_000_000),
  dietaryInformation: z.enum(["vegetarian", "non-vegetarian"]),
  isAvailable: boolish,
};
export const menuCreateBody = z.object({ ...menuFields, description: menuFields.description.default(""), dietaryInformation: menuFields.dietaryInformation.default("non-vegetarian"), isAvailable: menuFields.isAvailable.default(true) });
export const menuUpdateBody = z
  .object({ ...Object.fromEntries(Object.entries(menuFields).map(([k, v]) => [k, v.optional()])), removeImage: boolish.optional() })
  ;
export const menuListQuery = z.object({ ...pageQuery, limit: pageQuery.limit.default(100), category: objectId.optional() });

// ---------- Gallery ----------
export const galleryCreateBody = z.object({
  category: z.enum(GALLERY_CATEGORIES),
  title: str(120).optional(),
  titles: listOf(str(120)).optional(),
  description: z.string().trim().max(500).default(""),
  isFeatured: boolish.default(false),
  isActive: boolish.default(true),
});
export const galleryUpdateBody = z
  .object({ title: str(120).optional(), category: z.enum(GALLERY_CATEGORIES).optional(), description: z.string().trim().max(500).optional(), isFeatured: boolish.optional(), isActive: boolish.optional() })
  ;
export const galleryListQuery = z.object({ ...pageQuery, limit: pageQuery.limit.default(50), category: z.enum(GALLERY_CATEGORIES).optional(), featured: optionalBool, all: allFlag });

// ---------- Testimonials ----------
const testimonialFields = {
  guestName: str(80),
  rating: int(1, 5),
  review: str(1500, 5),
  guestLocation: z.string().trim().max(80),
  isFeatured: boolish,
  isPublished: boolish,
};
export const testimonialCreateBody = z.object({ ...testimonialFields, guestLocation: testimonialFields.guestLocation.default(""), isFeatured: testimonialFields.isFeatured.default(false), isPublished: testimonialFields.isPublished.default(false) });
export const testimonialUpdateBody = z.object(Object.fromEntries(Object.entries(testimonialFields).map(([k, v]) => [k, v.optional()]))).refine(atLeastOne, "Nothing to update");
export const testimonialListQuery = z.object({ ...pageQuery, featured: optionalBool, all: allFlag });

// ---------- Contact ----------
export const contactCreateBody = z.object({
  name: str(80, 2),
  email: emailField,
  phone: z.union([phoneField, z.literal("")]).optional(),
  subject: str(120, 3),
  message: str(2000, 10),
  website: z.string().max(200).optional(), // honeypot: real users leave it empty
});
export const contactUpdateBody = z.object({ status: z.enum(MESSAGE_STATUSES).optional(), isRead: boolish.optional() }).refine(atLeastOne, "Nothing to update");
export const contactListQuery = z.object({ ...pageQuery, q: z.string().trim().max(80).optional(), status: z.enum(MESSAGE_STATUSES).optional(), isRead: optionalBool });

// ---------- Settings ----------
export const settingsUpdateBody = z
  .object({
    homepage: z.record(z.string().max(80), z.record(z.string().max(80), z.string().max(5000))).optional(),
    hotelName: str(100).optional(),
    description: z.string().trim().max(2000).optional(),
    address: z.string().trim().max(300).optional(),
    contactNumbers: listOf(phoneField).optional(),
    email: z.union([emailField, z.literal("")]).optional(),
    whatsappNumber: z.string().trim().regex(/^\d{7,15}$/, "Digits only, international format, e.g. 923001234567").or(z.literal("")).optional(),
    socialLinks: jsonObject(z.object({ facebook: urlOrEmpty.optional(), instagram: urlOrEmpty.optional(), x: urlOrEmpty.optional(), youtube: urlOrEmpty.optional() })).optional(),
    checkInTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM").optional(),
    checkOutTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM").optional(),
    bookingPolicies: z.string().trim().max(5000).optional(),
    cancellationPolicies: z.string().trim().max(5000).optional(),
    seo: jsonObject(z.object({ title: z.string().trim().max(70).optional(), description: z.string().trim().max(200).optional() })).optional(),
    googleMapsUrl: urlOrEmpty.optional(),
    googleMapsEmbedUrl: urlOrEmpty.optional(),
    removeLogo: boolish.optional(),
  })
  ;
