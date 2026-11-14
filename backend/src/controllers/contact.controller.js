import { ContactMessage } from "../models/ContactMessage.js";
import { AppError } from "../utils/AppError.js";
import { ok } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { pageMeta, paginate } from "../utils/pagination.js";
import { toClient } from "../utils/serialize.js";
import { notifyNewContactMessage } from "../services/notification.service.js";

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const createMessage = asyncHandler(async (req, res) => {
  const { website, ...data } = req.valid.body;
  if (website) return ok(res, { received: true }, { status: 201 }); // honeypot filled: pretend success, store nothing
  const message = await ContactMessage.create(data);
  notifyNewContactMessage(message);
  return ok(res, { received: true }, { status: 201 });
});

export const listMessages = asyncHandler(async (req, res) => {
  const q = req.valid.query;
  const filter = {};
  if (q.status) filter.status = q.status;
  if (q.isRead !== undefined) filter.isRead = q.isRead;
  if (q.q) {
    const rx = new RegExp(escapeRegex(q.q), "i");
    filter.$or = [{ name: rx }, { email: rx }, { subject: rx }, { message: rx }];
  }
  const p = paginate(q);
  const [items, total] = await Promise.all([
    ContactMessage.find(filter).sort({ createdAt: -1 }).skip(p.skip).limit(p.limit).lean(),
    ContactMessage.countDocuments(filter),
  ]);
  ok(res, toClient(items), { meta: pageMeta(p, total) });
});

/** Opening a message marks it as read; PATCH can mark it unread again. */
export const getMessage = asyncHandler(async (req, res) => {
  const message = await ContactMessage.findByIdAndUpdate(req.valid.params.id, { isRead: true }, { returnDocument: "after" });
  if (!message) throw AppError.notFound("Message not found");
  ok(res, toClient(message));
});

export const updateMessage = asyncHandler(async (req, res) => {
  const message = await ContactMessage.findByIdAndUpdate(req.valid.params.id, { $set: req.valid.body }, { returnDocument: "after" });
  if (!message) throw AppError.notFound("Message not found");
  ok(res, toClient(message));
});

export const deleteMessage = asyncHandler(async (req, res) => {
  if (!(await ContactMessage.findByIdAndDelete(req.valid.params.id))) throw AppError.notFound("Message not found");
  ok(res, { deleted: true });
});
