import mongoose from "mongoose";

/** Dashboard notifications for admins/staff (new booking, new contact message). Read/list endpoints arrive with the admin panel. */
const notificationSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["booking", "contact"], required: true },
    title: { type: String, required: true },
    message: { type: String, default: "" },
    refId: { type: mongoose.Schema.Types.ObjectId },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

notificationSchema.index({ isRead: 1, createdAt: -1 });

export const Notification = mongoose.model("Notification", notificationSchema);
