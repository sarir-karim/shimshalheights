import { Booking } from "../models/Booking.js";
import { ContactMessage } from "../models/ContactMessage.js";
import { InventoryNight } from "../models/InventoryNight.js";
import { Notification } from "../models/Notification.js";
import { Room } from "../models/Room.js";
import { todayInHotelTz } from "../utils/dates.js";
import { toClient } from "../utils/serialize.js";

const MONTHS_BACK = 6;

/** The last N calendar months as "YYYY-MM", oldest first, so charts have no gaps. */
function lastMonths(n, now = new Date()) {
  const out = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    out.push(d.toISOString().slice(0, 7));
  }
  return out;
}

const fill = (months, rows, key = "value") => months.map((month) => ({ month, [key]: rows.find((r) => r._id === month)?.[key] ?? 0 }));

export async function getDashboardStats() {
  const months = lastMonths(MONTHS_BACK);
  const since = new Date(`${months[0]}-01T00:00:00Z`);
  const today = todayInHotelTz();

  const [statusRows, revenueRows, activeRooms, occupiedRows, bookingsByMonth, revenueByMonth, recentBookings, recentMessages, unreadMessages, unreadNotifications] = await Promise.all([
    Booking.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    // Revenue counts only bookings marked paid (refunded ones are excluded automatically).
    Booking.aggregate([{ $match: { paymentStatus: "paid" } }, { $group: { _id: null, total: { $sum: "$totalPrice" } } }]),
    Room.find({ isActive: true }).select("totalRooms").lean(),
    InventoryNight.aggregate([{ $match: { date: today } }, { $group: { _id: null, reserved: { $sum: "$reserved" } } }]),
    Booking.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, value: { $sum: 1 } } },
    ]),
    Booking.aggregate([
      { $match: { paymentStatus: "paid", checkIn: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$checkIn" } }, value: { $sum: "$totalPrice" } } },
    ]),
    Booking.find().sort({ createdAt: -1 }).limit(6).lean(),
    ContactMessage.find().sort({ createdAt: -1 }).limit(5).lean(),
    ContactMessage.countDocuments({ isRead: false }),
    Notification.countDocuments({ isRead: false }),
  ]);

  const byStatus = Object.fromEntries(["pending", "confirmed", "rejected", "cancelled", "completed"].map((s) => [s, statusRows.find((r) => r._id === s)?.count ?? 0]));
  const totalRooms = activeRooms.reduce((sum, r) => sum + r.totalRooms, 0);
  const reservedTonight = Math.min(occupiedRows[0]?.reserved ?? 0, totalRooms);

  return toClient({
    bookings: { total: Object.values(byStatus).reduce((a, b) => a + b, 0), ...byStatus },
    rooms: { total: totalRooms, reservedTonight, availableTonight: totalRooms - reservedTonight, roomTypes: activeRooms.length },
    revenue: { paid: revenueRows[0]?.total ?? 0 },
    trends: { bookingsByMonth: fill(months, bookingsByMonth), revenueByMonth: fill(months, revenueByMonth) },
    recentBookings,
    recentMessages,
    unreadMessages,
    unreadNotifications,
    asOf: today,
  });
}
