import { Notification } from "../models/Notification.js";
import { AppError } from "../utils/AppError.js";
import { ok } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { toClient } from "../utils/serialize.js";
import { getDashboardStats } from "../services/stats.service.js";

export const stats = asyncHandler(async (_req, res) => ok(res, await getDashboardStats()));

export const listNotifications = asyncHandler(async (_req, res) => {
  const [items, unread] = await Promise.all([Notification.find().sort({ createdAt: -1 }).limit(20).lean(), Notification.countDocuments({ isRead: false })]);
  ok(res, toClient(items), { meta: { unread } });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const n = await Notification.findByIdAndUpdate(req.valid.params.id, { isRead: true }, { returnDocument: "after" });
  if (!n) throw AppError.notFound("Notification not found");
  ok(res, toClient(n));
});

export const markAllNotificationsRead = asyncHandler(async (_req, res) => {
  const r = await Notification.updateMany({ isRead: false }, { isRead: true });
  ok(res, { updated: r.modifiedCount });
});
