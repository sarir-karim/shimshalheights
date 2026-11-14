import mongoose from "mongoose";
import { imageSchema } from "./_image.js";

export const ROOM_TYPES = ["standard", "deluxe", "family", "suite"];

const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true, trim: true, maxlength: 4000 },
    shortDescription: { type: String, required: true, trim: true, maxlength: 240 },
    pricePerNight: { type: Number, required: true, min: 0 },
    roomType: { type: String, enum: ROOM_TYPES, required: true },
    maxAdults: { type: Number, required: true, min: 1, max: 20 },
    maxChildren: { type: Number, default: 0, min: 0, max: 20 },
    totalRooms: { type: Number, required: true, min: 1, max: 200 },
    bedConfiguration: { type: String, required: true, trim: true, maxlength: 100 },
    amenities: { type: [String], default: [] },
    images: { type: [imageSchema], default: [] },
    featured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

roomSchema.index({ isActive: 1, featured: 1 });
roomSchema.index({ pricePerNight: 1 });

export const Room = mongoose.model("Room", roomSchema);
