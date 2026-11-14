import mongoose from "mongoose";
import { imageSchema } from "./_image.js";

const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, default: "", maxlength: 500 },
    category: { type: mongoose.Schema.Types.ObjectId, required: true }, // _id of an entry in Restaurant.menuCategories
    price: { type: Number, required: true, min: 0 },
    image: { type: imageSchema, default: undefined },
    dietaryInformation: { type: String, enum: ["vegetarian", "non-vegetarian"], default: "non-vegetarian" },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true },
);

menuItemSchema.index({ category: 1 });

export const MenuItem = mongoose.model("MenuItem", menuItemSchema);
