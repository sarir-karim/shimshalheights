import type { Room, GalleryCategory } from "@/types";

export interface AdminUser { id: string; name: string; email: string; role: "admin" | "staff"; isActive: boolean }
export interface ApiMeta { page: number; limit: number; total: number; totalPages: number; unread?: number }

export type BookingStatus = "pending" | "confirmed" | "rejected" | "cancelled" | "completed";
export type PaymentStatus = "unpaid" | "paid" | "refunded";

export interface BookingRecord {
  id: string;
  bookingReference: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  room: string | { id: string; name: string; slug: string };
  roomName: string;
  checkIn: string;
  checkOut: string;
  numberOfAdults: number;
  numberOfChildren: number;
  numberOfRooms: number;
  numberOfNights: number;
  pricePerNight: number;
  totalPrice: number;
  specialRequests: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  statusHistory: { status: BookingStatus; at: string; by: string; note: string }[];
  createdAt: string;
}

export type AdminRoom = Omit<Room, "images"> & { images: { url: string; publicId: string; alt?: string }[]; createdAt?: string };
export interface AdminMenuCategory { id: string; name: string; order: number }
export interface AdminMenuItem {
  id: string; name: string; description: string; category: string; price: number;
  image?: { url: string; publicId: string; alt?: string }; dietaryInformation: "vegetarian" | "non-vegetarian"; isAvailable: boolean;
}
export interface RestaurantDoc {
  id: string; name: string; description: string; openingHours: { label: string; hours: string }[]; facilities: string[];
  images: { url: string; publicId: string; alt?: string }[]; menuCategories: AdminMenuCategory[]; isActive: boolean;
}
export interface GalleryRecord {
  id: string; title: string; category: GalleryCategory; imageUrl: string; cloudinaryPublicId: string; description: string; isFeatured: boolean; isActive: boolean;
}
export interface TestimonialRecord { id: string; guestName: string; rating: number; review: string; guestLocation: string; isFeatured: boolean; isPublished: boolean }
export interface MessageRecord { id: string; name: string; email: string; phone: string; subject: string; message: string; status: "new" | "replied" | "archived"; isRead: boolean; createdAt: string }
export interface NotificationRecord { id: string; type: "booking" | "contact"; title: string; message: string; isRead: boolean; createdAt: string }

export interface SettingsDoc {
  hotelName: string; logo?: { url: string; publicId: string }; description: string; address: string; contactNumbers: string[]; email: string; whatsappNumber: string;
  socialLinks: { facebook: string; instagram: string; x: string; youtube: string }; checkInTime: string; checkOutTime: string;
  bookingPolicies: string; cancellationPolicies: string; seo: { title: string; description: string }; googleMapsUrl: string; googleMapsEmbedUrl: string;
}

export interface DashboardStats {
  bookings: { total: number } & Record<BookingStatus, number>;
  rooms: { total: number; reservedTonight: number; availableTonight: number; roomTypes: number };
  revenue: { paid: number };
  trends: { bookingsByMonth: { month: string; value: number }[]; revenueByMonth: { month: string; value: number }[] };
  recentBookings: BookingRecord[];
  recentMessages: MessageRecord[];
  unreadMessages: number;
  unreadNotifications: number;
  asOf: string;
}
