import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "main", unique: true, immutable: true }, // singleton guard
    homepage: { type: Map, of: new mongoose.Schema({}, { strict: false, _id: false }), default: {} },
    hotelName: { type: String, default: "Shimshal Heights", trim: true },
    logo: { type: new mongoose.Schema({ url: String, publicId: String }, { _id: false }), default: undefined },
    description: { type: String, default: "", maxlength: 2000 },
    address: { type: String, default: "", maxlength: 300 },
    contactNumbers: { type: [String], default: [] },
    email: { type: String, default: "", trim: true },
    whatsappNumber: { type: String, default: "", trim: true }, // digits, international format
    socialLinks: {
      facebook: { type: String, default: "" },
      instagram: { type: String, default: "" },
      x: { type: String, default: "" },
      youtube: { type: String, default: "" },
    },
    checkInTime: { type: String, default: "14:00" },
    checkOutTime: { type: String, default: "11:00" },
    bookingPolicies: { type: String, default: "", maxlength: 5000 },
    cancellationPolicies: { type: String, default: "", maxlength: 5000 },
    seo: { title: { type: String, default: "" }, description: { type: String, default: "" } },
    googleMapsUrl: { type: String, default: "" },
    googleMapsEmbedUrl: { type: String, default: "" },
  },
  { timestamps: true, toObject: { flattenMaps: true } },
);

export const Settings = mongoose.model("Settings", settingsSchema);
