import mongoose from "mongoose";

export const MESSAGE_STATUSES = ["new", "replied", "archived"];

const contactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, default: "", trim: true, maxlength: 30 },
    subject: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    status: { type: String, enum: MESSAGE_STATUSES, default: "new" },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: true } },
);

contactMessageSchema.index({ createdAt: -1 });
contactMessageSchema.index({ isRead: 1, status: 1 });

export const ContactMessage = mongoose.model("ContactMessage", contactMessageSchema);
