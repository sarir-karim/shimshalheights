import mongoose from "mongoose";
import { imageSchema } from "./_image.js";

const restaurantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, default: "Shimshal Heights Restaurant" },
    description: { type: String, default: "", maxlength: 4000 },
    openingHours: { type: [new mongoose.Schema({ label: String, hours: String }, { _id: false })], default: [] },
    facilities: { type: [String], default: [] },
    images: { type: [imageSchema], default: [] },
    menuCategories: {
      type: [new mongoose.Schema({ name: { type: String, required: true, trim: true, maxlength: 60 }, order: { type: Number, default: 0 } })],
      default: [],
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Restaurant = mongoose.model("Restaurant", restaurantSchema);
