import mongoose from "mongoose";

export const GALLERY_CATEGORIES = ["Hotel Exterior", "Rooms", "Restaurant", "Food", "Mountains & Nature", "Shimshal Valley"];

const gallerySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    category: { type: String, enum: GALLERY_CATEGORIES, required: true },
    imageUrl: { type: String, required: true },
    cloudinaryPublicId: { type: String, required: true },
    description: { type: String, default: "", maxlength: 500 },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

gallerySchema.index({ category: 1, isActive: 1 });

export const Gallery = mongoose.model("Gallery", gallerySchema);
